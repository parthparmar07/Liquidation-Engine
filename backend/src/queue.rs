use std::sync::Mutex;
use std::collections::{BinaryHeap, HashSet};
use std::cmp::Ordering;
use crate::monitor::Position;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct QueueItem {
    pub position: Position,
    pub margin_ratio: f64,
}

impl PartialEq for QueueItem {
    fn eq(&self, other: &Self) -> bool {
        self.position.id == other.position.id
    }
}

impl Eq for QueueItem {}

impl PartialOrd for QueueItem {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        // Lower margin ratio has higher priority (Reverse order)
        other.margin_ratio.partial_cmp(&self.margin_ratio)
    }
}

impl Ord for QueueItem {
    fn cmp(&self, other: &Self) -> Ordering {
        self.partial_cmp(other).unwrap_or(Ordering::Equal)
    }
}

pub struct LiquidationQueue {
    heap: Mutex<BinaryHeap<QueueItem>>,
    set: Mutex<HashSet<String>>, // For deduplication
}

impl LiquidationQueue {
    pub fn new() -> Self {
        Self {
            heap: Mutex::new(BinaryHeap::new()),
            set: Mutex::new(HashSet::new()),
        }
    }

    pub async fn push(&self, position: Position, margin_ratio: f64) {
        let mut set = self.set.lock().unwrap();
        if set.contains(&position.id) {
            return; // Already in queue
        }
        
        set.insert(position.id.clone());
        let mut heap = self.heap.lock().unwrap();
        heap.push(QueueItem { position, margin_ratio });
    }

    pub async fn pop(&self) -> Option<Position> {
        let mut heap = self.heap.lock().unwrap();
        if let Some(item) = heap.pop() {
            let mut set = self.set.lock().unwrap();
            set.remove(&item.position.id);
            Some(item.position)
        } else {
            None
        }
    }

    // New method for API
    pub async fn get_snapshot(&self) -> Vec<QueueItem> {
        let heap = self.heap.lock().unwrap();
        heap.clone().into_sorted_vec()
    }
}
