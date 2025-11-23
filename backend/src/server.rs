use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_cors::Cors;
use std::sync::Arc;
use crate::db::Database;
use crate::queue::LiquidationQueue;

pub struct AppState {
    pub db: Arc<Database>,
    pub queue: Arc<LiquidationQueue>,
}

async fn get_health() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({ "status": "ok" }))
}

async fn get_recent_liquidations(data: web::Data<AppState>) -> impl Responder {
    match data.db.get_recent_liquidations(50).await {
        Ok(liquidations) => HttpResponse::Ok().json(liquidations),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({ "error": e.to_string() })),
    }
}

async fn get_liquidation_stats(data: web::Data<AppState>) -> impl Responder {
    match data.db.get_liquidation_stats(24).await {
        Ok(stats) => HttpResponse::Ok().json(stats),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({ "error": e.to_string() })),
    }
}

async fn get_insurance_fund_history(data: web::Data<AppState>) -> impl Responder {
    match data.db.get_insurance_fund_history(50).await {
        Ok(history) => HttpResponse::Ok().json(history),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({ "error": e.to_string() })),
    }
}

// Mock endpoint for pending liquidations since Queue doesn't expose list yet
async fn get_pending_liquidations(data: web::Data<AppState>) -> impl Responder {
    let snapshot = data.queue.get_snapshot().await;
    HttpResponse::Ok().json(serde_json::json!({ 
        "pending_count": snapshot.len(), 
        "positions": snapshot 
    }))
}

use crate::websocket::{self, Broadcaster};

// ... imports ...

pub async fn start_server(
    db: Arc<Database>, 
    queue: Arc<LiquidationQueue>,
    broadcaster: Arc<Broadcaster>
) -> std::io::Result<()> {
    let app_state = web::Data::new(AppState {
        db,
        queue,
    });
    let broadcaster_data = web::Data::new(broadcaster);

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::permissive())
            .app_data(app_state.clone())
            .app_data(broadcaster_data.clone())
            .route("/health", web::get().to(get_health))
            .route("/liquidations/history", web::get().to(get_recent_liquidations))
            .route("/liquidations/stats", web::get().to(get_liquidation_stats))
            .route("/liquidations/pending", web::get().to(get_pending_liquidations))
            .route("/insurance-fund/history", web::get().to(get_insurance_fund_history))
            .route("/ws", web::get().to(websocket::ws_handler))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
