const db = require('./db');

async function migrate() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS performance_objectives (
      id INT PRIMARY KEY AUTO_INCREMENT,
      ipcrf_objective_id INT NOT NULL,
      sequence_no INT DEFAULT 1,
      objective_description TEXT,
      mfo_category VARCHAR(200),
      timeline_start DATE,
      timeline_end DATE,
      objective_weight DECIMAL(5,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ipcrf_objective_id) REFERENCES ipcrf_objectives(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS performance_indicators (
      id INT PRIMARY KEY AUTO_INCREMENT,
      performance_objective_id INT NOT NULL,
      dimension ENUM('quality_effectiveness', 'efficiency', 'timeliness') NOT NULL,
      level_5_text VARCHAR(500),
      level_4_text VARCHAR(500),
      level_3_text VARCHAR(500),
      level_2_text VARCHAR(500),
      level_1_text VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (performance_objective_id) REFERENCES performance_objectives(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS planned_mov_items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      performance_objective_id INT NOT NULL,
      description VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (performance_objective_id) REFERENCES performance_objectives(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS objective_self_ratings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      performance_objective_id INT NOT NULL UNIQUE,
      quality_rating DECIMAL(3,1),
      efficiency_rating DECIMAL(3,1),
      timeliness_rating DECIMAL(3,1),
      average_rating DECIMAL(3,2),
      score DECIMAL(5,2),
      rated_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (performance_objective_id) REFERENCES performance_objectives(id) ON DELETE CASCADE
    )`
  ];

  for (const sql of tables) {
    await db.query(sql);
  }

  const [tables_list] = await db.query("SHOW TABLES LIKE '%performance%'");
  console.log('Performance tables:', tables_list.map(t => Object.values(t)[0]).join(', '));
  const [obj_cols] = await db.query('DESCRIBE performance_objectives');
  console.log('performance_objectives columns:', obj_cols.map(c => c.Field).join(', '));
  process.exit(0);
}

migrate().catch(e => { console.error(e.message); process.exit(1); });
