use actix_web::{rt, web, Error, HttpRequest, HttpResponse};
use actix_ws::Message;
use futures::StreamExt as _;
use tokio::sync::broadcast;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    #[serde(rename = "price_update")]
    PriceUpdate { symbol: String, price: f64 },
    
    #[serde(rename = "liquidation")]
    LiquidationEvent { position_id: String, symbol: String, amount: f64, price: f64 },
    
    #[serde(rename = "insurance_fund")]
    InsuranceFundUpdate { balance: u64 },
}

pub struct Broadcaster {
    tx: broadcast::Sender<WsMessage>,
}

impl Broadcaster {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(100);
        Self { tx }
    }

    pub fn send(&self, msg: WsMessage) {
        let _ = self.tx.send(msg);
    }

    pub fn subscribe(&self) -> broadcast::Receiver<WsMessage> {
        self.tx.subscribe()
    }
}

pub async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
    broadcaster: web::Data<Arc<Broadcaster>>,
) -> Result<HttpResponse, Error> {
    let (res, mut session, mut stream) = actix_ws::handle(&req, stream)?;

    let mut rx = broadcaster.subscribe();

    rt::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(30));

        loop {
            tokio::select! {
                Some(Ok(msg)) = stream.next() => {
                    match msg {
                        Message::Text(_) => {
                            // Echo or handle client messages if needed
                        }
                        Message::Close(_) => break,
                        Message::Ping(bytes) => {
                            let _ = session.pong(&bytes).await;
                        }
                        _ => {}
                    }
                }
                
                Ok(broadcast_msg) = rx.recv() => {
                    if let Ok(json) = serde_json::to_string(&broadcast_msg) {
                        if session.text(json).await.is_err() {
                            break;
                        }
                    }
                }
                
                _ = interval.tick() => {
                    if session.ping(b"").await.is_err() {
                        break;
                    }
                }
            }
        }

        let _ = session.close(None).await;
    });

    Ok(res)
}
