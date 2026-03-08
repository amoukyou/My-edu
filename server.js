const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3480;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ 数据库初始化 ============
const db = new Database(path.join(__dirname, 'fumajiaoyu.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    type TEXT,           -- 'public' / 'private' / 'foreign_branch'
    qs_ranking INTEGER,  -- QS世界排名 (0=未上榜)
    city TEXT,
    strengths TEXT,      -- JSON数组: 优势专业
    min_gpa REAL,        -- 最低GPA要求 (4.0制)
    ielts_min REAL,      -- 最低雅思要求
    tuition_min INTEGER, -- 年学费下限(人民币)
    tuition_max INTEGER, -- 年学费上限(人民币)
    living_cost INTEGER, -- 年生活费(人民币)
    apply_months INTEGER,-- 申请周期(月)
    intake TEXT,         -- 入学月份 JSON数组
    description TEXT,
    service_fee INTEGER  -- 中介服务费(人民币)
  );

  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY,
    uni_id INTEGER REFERENCES universities(id),
    name TEXT,
    level TEXT,          -- 'bachelor' / 'master' / 'phd'
    category TEXT,       -- 专业大类
    duration_years REAL,
    tuition_total INTEGER, -- 总学费(人民币)
    gpa_req REAL,
    ielts_req REAL,
    special_req TEXT,    -- 特殊要求
    language TEXT         -- 'english' / 'malay' / 'bilingual'
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    wechat TEXT,
    education TEXT,
    gpa REAL,
    ielts REAL,
    budget INTEGER,
    target_level TEXT,
    target_major TEXT,
    preferences TEXT,
    results TEXT,        -- JSON: 匹配结果
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ============ 种子数据 ============
const uniCount = db.prepare('SELECT COUNT(*) as c FROM universities').get().c;
if (uniCount === 0) {
  const insertUni = db.prepare(`
    INSERT INTO universities (name, name_en, type, qs_ranking, city, strengths, min_gpa, ielts_min,
      tuition_min, tuition_max, living_cost, apply_months, intake, description, service_fee)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const insertProg = db.prepare(`
    INSERT INTO programs (uni_id, name, level, category, duration_years, tuition_total, gpa_req, ielts_req, special_req, language)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);

  const universities = [
    // 公立大学
    {
      u: ['马来亚大学','University of Malaya','public',60,'吉隆坡',
        '["商科","工程","医学","计算机","教育","法学"]', 3.0, 5.5,
        15000, 35000, 30000, 4, '["2月","9月"]',
        'QS世界排名前100，马来西亚排名第一的综合性公立大学，学术声誉极高', 12000],
      p: [
        ['工商管理学士','bachelor','商科',3.5,80000,3.0,5.5,null,'english'],
        ['计算机科学学士','bachelor','计算机',4,90000,3.0,5.5,null,'english'],
        ['工商管理硕士(MBA)','master','商科',1.5,65000,3.0,6.0,null,'english'],
        ['计算机科学硕士','master','计算机',2,55000,3.0,6.0,null,'english'],
        ['教育学硕士','master','教育',1.5,40000,3.0,6.0,null,'english'],
        ['土木工程学士','bachelor','工程',4,85000,3.0,5.5,'需数学基础','english'],
      ]
    },
    {
      u: ['博特拉大学','Universiti Putra Malaysia','public',123,'雪兰莪',
        '["农业","商科","工程","环境科学","食品科学"]', 2.8, 5.5,
        12000, 28000, 25000, 3, '["2月","9月"]',
        'QS世界前150，农业和食品科学领域东南亚领先，校园环境优美', 10000],
      p: [
        ['农业科学学士','bachelor','农业',4,60000,2.8,5.5,null,'english'],
        ['工商管理学士','bachelor','商科',3.5,65000,2.8,5.5,null,'english'],
        ['食品科学硕士','master','理科',2,45000,3.0,6.0,null,'english'],
        ['MBA','master','商科',1.5,55000,3.0,6.0,null,'english'],
        ['环境科学硕士','master','理科',2,40000,3.0,6.0,null,'english'],
      ]
    },
    {
      u: ['国民大学','Universiti Kebangsaan Malaysia','public',138,'雪兰莪',
        '["医学","工程","社会科学","商科","教育"]', 2.8, 5.5,
        12000, 30000, 25000, 3, '["2月","9月"]',
        'QS世界前150，马来西亚国民教育标杆，医学和社会科学实力强', 10000],
      p: [
        ['商业管理学士','bachelor','商科',3.5,68000,2.8,5.5,null,'english'],
        ['电气工程学士','bachelor','工程',4,80000,3.0,5.5,'需数学物理基础','english'],
        ['教育学硕士','master','教育',2,42000,3.0,6.0,null,'english'],
        ['工商管理硕士','master','商科',1.5,58000,3.0,6.0,null,'english'],
      ]
    },
    {
      u: ['理科大学','Universiti Sains Malaysia','public',137,'槟城',
        '["理科","工程","医学","药学","建筑"]', 2.8, 5.5,
        12000, 30000, 22000, 3, '["2月","9月"]',
        'QS世界前150，APEX大学(顶尖大学)称号，理工科实力雄厚', 10000],
      p: [
        ['计算机科学学士','bachelor','计算机',4,72000,2.8,5.5,null,'english'],
        ['建筑学学士','bachelor','艺术设计',4,85000,3.0,5.5,'需作品集','english'],
        ['药学学士','bachelor','医学',4,95000,3.2,6.0,null,'english'],
        ['管理学硕士','master','商科',1.5,45000,3.0,6.0,null,'english'],
      ]
    },
    {
      u: ['理工大学','Universiti Teknologi Malaysia','public',181,'柔佛',
        '["工程","计算机","建筑","商科","理科"]', 2.8, 5.5,
        10000, 25000, 22000, 3, '["2月","9月"]',
        'QS世界前200，马来西亚顶级理工大学，工程和计算机实力强劲', 10000],
      p: [
        ['机械工程学士','bachelor','工程',4,70000,2.8,5.5,'需数学物理基础','english'],
        ['软件工程学士','bachelor','计算机',4,72000,2.8,5.5,null,'english'],
        ['工商管理硕士','master','商科',1.5,50000,3.0,6.0,null,'english'],
        ['计算机科学硕士','master','计算机',2,48000,3.0,6.0,null,'english'],
      ]
    },
    // 私立大学
    {
      u: ['泰莱大学','Taylor\'s University','private',251,'吉隆坡',
        '["酒店管理","商科","设计","传媒","计算机"]', 2.5, 5.0,
        30000, 55000, 35000, 2, '["1月","3月","8月"]',
        'QS世界前300，酒店管理专业亚洲第一，私立大学排名马来西亚第一', 15000],
      p: [
        ['酒店管理学士','bachelor','酒店旅游',3,135000,2.5,5.0,null,'english'],
        ['工商管理学士','bachelor','商科',3,120000,2.5,5.0,null,'english'],
        ['大众传媒学士','bachelor','传媒',3,110000,2.5,5.0,null,'english'],
        ['设计学学士','bachelor','艺术设计',3,125000,2.5,5.0,'需作品集','english'],
        ['MBA','master','商科',1.5,90000,2.5,6.0,null,'english'],
        ['计算机科学硕士','master','计算机',1.5,80000,2.5,6.0,null,'english'],
      ]
    },
    {
      u: ['思特雅大学','UCSI University','private',284,'吉隆坡',
        '["音乐","商科","工程","医学","计算机"]', 2.5, 5.0,
        25000, 50000, 30000, 2, '["1月","5月","9月"]',
        'QS世界前300，音乐专业全马第一，综合性强的私立大学', 13000],
      p: [
        ['音乐表演学士','bachelor','艺术设计',3,130000,2.5,5.0,'需面试/试演','english'],
        ['工商管理学士','bachelor','商科',3,100000,2.5,5.0,null,'english'],
        ['电气工程学士','bachelor','工程',4,110000,2.5,5.5,null,'english'],
        ['MBA','master','商科',1,70000,2.5,6.0,null,'english'],
        ['计算机科学硕士','master','计算机',1.5,68000,2.5,6.0,null,'english'],
      ]
    },
    {
      u: ['英迪大学','INTI International University','private',0,'森美兰',
        '["商科","计算机","工程","传媒","设计"]', 2.3, 5.0,
        20000, 40000, 25000, 2, '["1月","5月","8月"]',
        '与多所欧美名校合作双学位项目，性价比高的私立大学', 12000],
      p: [
        ['会计学学士','bachelor','商科',3,85000,2.3,5.0,null,'english'],
        ['计算机科学学士','bachelor','计算机',3,80000,2.3,5.0,null,'english'],
        ['大众传媒学士','bachelor','传媒',3,78000,2.3,5.0,null,'english'],
        ['MBA','master','商科',1,55000,2.5,6.0,null,'english'],
      ]
    },
    {
      u: ['亚太科技大学','Asia Pacific University (APU)','private',0,'吉隆坡',
        '["计算机","商科","设计","工程","游戏开发"]', 2.3, 5.0,
        22000, 42000, 30000, 2, '["1月","3月","5月","9月","11月"]',
        '马来西亚IT专业最强私立大学，毕业生就业率高达99%', 12000],
      p: [
        ['软件工程学士','bachelor','计算机',3,90000,2.3,5.0,null,'english'],
        ['游戏开发学士','bachelor','计算机',3,92000,2.3,5.0,null,'english'],
        ['网络安全学士','bachelor','计算机',3,88000,2.3,5.0,null,'english'],
        ['工商管理学士','bachelor','商科',3,80000,2.3,5.0,null,'english'],
        ['数字媒体硕士','master','传媒',1.5,60000,2.5,6.0,null,'english'],
      ]
    },
    {
      u: ['双威大学','Sunway University','private',0,'吉隆坡',
        '["商科","计算机","传媒","心理学","设计"]', 2.5, 5.5,
        28000, 50000, 32000, 2, '["1月","3月","8月"]',
        '与兰卡斯特大学合作双学位，校园设施一流', 14000],
      p: [
        ['会计与金融学士','bachelor','商科',3,120000,2.5,5.5,null,'english'],
        ['心理学学士','bachelor','社科',3,100000,2.5,5.5,null,'english'],
        ['计算机科学学士','bachelor','计算机',3,105000,2.5,5.5,null,'english'],
        ['传媒学学士','bachelor','传媒',3,98000,2.5,5.5,null,'english'],
        ['MBA','master','商科',1.5,85000,2.5,6.0,null,'english'],
      ]
    },
    // 海外分校
    {
      u: ['诺丁汉大学马来西亚分校','University of Nottingham Malaysia','foreign_branch',100,'雪兰莪',
        '["工程","商科","理科","社科","计算机"]', 3.0, 6.0,
        45000, 70000, 35000, 3, '["2月","9月"]',
        '英国诺丁汉大学海外分校，毕业获英国本校同等学位', 15000],
      p: [
        ['商业管理学士','bachelor','商科',3,160000,3.0,6.0,null,'english'],
        ['计算机科学学士','bachelor','计算机',3,175000,3.0,6.0,null,'english'],
        ['化学工程学士','bachelor','工程',4,200000,3.0,6.0,'需数学化学基础','english'],
        ['MBA','master','商科',1.5,120000,3.0,6.5,null,'english'],
        ['教育学硕士','master','教育',1,80000,3.0,6.5,null,'english'],
      ]
    },
    {
      u: ['莫纳什大学马来西亚分校','Monash University Malaysia','foreign_branch',37,'雪兰莪',
        '["商科","工程","理科","医学","传媒"]', 3.0, 6.0,
        50000, 80000, 35000, 3, '["2月","7月","10月"]',
        '澳洲八大名校莫纳什大学分校，QS全球前50，学位含金量极高', 15000],
      p: [
        ['商业学士','bachelor','商科',3,180000,3.0,6.0,null,'english'],
        ['工程学士','bachelor','工程',4,220000,3.0,6.0,'需数学物理基础','english'],
        ['计算机科学学士','bachelor','计算机',3,185000,3.0,6.0,null,'english'],
        ['MBA','master','商科',1.5,130000,3.0,6.5,null,'english'],
      ]
    },
    {
      u: ['林国荣创意科技大学','Limkokwing University','private',0,'赛博再也',
        '["设计","传媒","动画","建筑","时尚"]', 2.0, 5.0,
        18000, 35000, 25000, 2, '["1月","5月","9月"]',
        '创意和设计类专业全马领先，艺术类学生首选', 10000],
      p: [
        ['平面设计学士','bachelor','艺术设计',3,75000,2.0,5.0,'需作品集','english'],
        ['动画学士','bachelor','艺术设计',3,80000,2.0,5.0,'需作品集','english'],
        ['时尚设计学士','bachelor','艺术设计',3,78000,2.0,5.0,'需作品集','english'],
        ['建筑学学士','bachelor','艺术设计',3.5,85000,2.3,5.0,'需作品集','english'],
        ['多媒体创意硕士','master','艺术设计',1.5,50000,2.5,5.5,null,'english'],
      ]
    },
    {
      u: ['世纪大学','SEGi University','private',0,'吉隆坡',
        '["商科","工程","教育","医学","传媒"]', 2.0, 5.0,
        15000, 35000, 25000, 2, '["1月","5月","9月"]',
        '马来西亚最大私立大学之一，学费亲民，专业齐全', 10000],
      p: [
        ['会计学学士','bachelor','商科',3,70000,2.0,5.0,null,'english'],
        ['早期教育学士','bachelor','教育',3,65000,2.0,5.0,null,'english'],
        ['护理学学士','bachelor','医学',4,95000,2.5,5.5,null,'english'],
        ['MBA','master','商科',1,50000,2.5,6.0,null,'english'],
        ['教育学硕士','master','教育',1.5,45000,2.5,5.5,null,'english'],
      ]
    },
    {
      u: ['马来西亚北方大学','Universiti Utara Malaysia','public',451,'吉打',
        '["商科","管理","会计","金融","公共管理"]', 2.5, 5.5,
        8000, 18000, 18000, 3, '["2月","9月"]',
        '马来西亚管理类专业最强公立大学，学费低廉，性价比极高', 8000],
      p: [
        ['会计学学士','bachelor','商科',4,50000,2.5,5.5,null,'english'],
        ['金融学学士','bachelor','商科',4,48000,2.5,5.5,null,'english'],
        ['人力资源管理学士','bachelor','商科',4,45000,2.5,5.5,null,'english'],
        ['MBA','master','商科',1.5,32000,2.7,6.0,null,'english'],
        ['公共管理硕士','master','社科',1.5,28000,2.7,6.0,null,'english'],
      ]
    },
  ];

  const insertAll = db.transaction(() => {
    for (const { u, p } of universities) {
      const info = insertUni.run(...u);
      const uniId = info.lastInsertRowid;
      for (const prog of p) {
        insertProg.run(uniId, ...prog);
      }
    }
  });
  insertAll();
  console.log('✅ 种子数据已写入');
}

// ============ 匹配算法 ============
function matchUniversities(student) {
  const { education, gpa, ielts, budget, targetLevel, targetMajor, preferences } = student;

  // 将百分制GPA转换为4.0制
  let gpa4 = gpa;
  if (gpa > 4.0) {
    if (gpa >= 90) gpa4 = 3.7;
    else if (gpa >= 85) gpa4 = 3.5;
    else if (gpa >= 80) gpa4 = 3.3;
    else if (gpa >= 75) gpa4 = 3.0;
    else if (gpa >= 70) gpa4 = 2.7;
    else if (gpa >= 65) gpa4 = 2.3;
    else if (gpa >= 60) gpa4 = 2.0;
    else gpa4 = 1.5;
  }

  const programs = db.prepare(`
    SELECT p.*, u.name as uni_name, u.name_en, u.type as uni_type, u.qs_ranking,
           u.city, u.strengths, u.tuition_min, u.tuition_max, u.living_cost,
           u.apply_months, u.intake, u.description as uni_desc, u.service_fee, u.min_gpa, u.ielts_min
    FROM programs p
    JOIN universities u ON p.uni_id = u.id
    WHERE p.level = ?
  `).all(targetLevel);

  const results = [];

  for (const prog of programs) {
    let score = 0;
    let reasons = [];
    let warnings = [];

    // 1. 专业匹配 (0-30分)
    if (targetMajor && targetMajor !== '不限') {
      if (prog.category === targetMajor) {
        score += 30;
        reasons.push('专业方向完全匹配');
      } else {
        continue; // 专业不匹配直接跳过
      }
    } else {
      score += 15; // 不限专业给一半分
    }

    // 2. GPA匹配 (0-25分)
    const gpaReq = prog.gpa_req || prog.min_gpa || 2.5;
    if (gpa4 >= gpaReq + 0.5) {
      score += 25;
      reasons.push('GPA远超要求');
    } else if (gpa4 >= gpaReq + 0.2) {
      score += 20;
      reasons.push('GPA高于要求');
    } else if (gpa4 >= gpaReq) {
      score += 15;
      reasons.push('GPA达标');
    } else if (gpa4 >= gpaReq - 0.3) {
      score += 5;
      warnings.push('GPA略低于要求，需额外材料补充');
    } else {
      score -= 10;
      warnings.push('GPA低于最低要求，录取难度大');
    }

    // 3. 语言成绩 (0-20分)
    const ieltsReq = prog.ielts_req || prog.ielts_min || 5.5;
    const effectiveIelts = ielts || 0;
    if (effectiveIelts >= ieltsReq + 0.5) {
      score += 20;
      reasons.push('语言成绩优秀');
    } else if (effectiveIelts >= ieltsReq) {
      score += 15;
      reasons.push('语言成绩达标');
    } else if (effectiveIelts >= ieltsReq - 0.5) {
      score += 5;
      warnings.push('语言成绩略低，可先读语言班');
    } else if (effectiveIelts === 0) {
      score += 5;
      warnings.push('无语言成绩，需参加学校内测或先读语言班');
    } else {
      warnings.push('语言成绩较低，建议先读语言预科');
    }

    // 4. 预算匹配 (0-15分)
    const yearlyTotal = (prog.tuition_total / prog.duration_years) + prog.living_cost;
    const totalCost = prog.tuition_total + prog.living_cost * prog.duration_years + prog.service_fee;
    if (budget && budget > 0) {
      if (budget >= totalCost * 1.2) {
        score += 15;
        reasons.push('预算充裕');
      } else if (budget >= totalCost) {
        score += 12;
        reasons.push('预算匹配');
      } else if (budget >= totalCost * 0.8) {
        score += 5;
        warnings.push('预算略紧张');
      } else {
        score -= 5;
        warnings.push('预算不足，建议考虑更经济的方案');
      }
    } else {
      score += 8;
    }

    // 5. 偏好加分 (0-10分)
    if (preferences) {
      if (preferences.includes('排名优先') && prog.qs_ranking > 0 && prog.qs_ranking <= 200) {
        score += 10;
        reasons.push(`QS世界排名第${prog.qs_ranking}位`);
      }
      if (preferences.includes('性价比') && yearlyTotal < 50000) {
        score += 10;
        reasons.push('年度费用低于5万，性价比高');
      }
      if (preferences.includes('就业导向') && prog.uni_type === 'private') {
        score += 5;
        reasons.push('私立大学就业服务完善');
      }
      if (preferences.includes('学位认可') && prog.uni_type === 'foreign_branch') {
        score += 8;
        reasons.push('海外名校分校，学位国际认可');
      }
      if (preferences.includes('城市生活') && prog.city === '吉隆坡') {
        score += 5;
        reasons.push('位于首都吉隆坡');
      }
    }

    // 计算成功率
    let successRate;
    if (score >= 70) successRate = Math.min(95, 80 + Math.floor(Math.random() * 10));
    else if (score >= 55) successRate = 65 + Math.floor(Math.random() * 15);
    else if (score >= 40) successRate = 45 + Math.floor(Math.random() * 15);
    else if (score >= 25) successRate = 25 + Math.floor(Math.random() * 15);
    else successRate = Math.max(5, 10 + Math.floor(Math.random() * 10));

    // GPA不足大幅降低成功率
    if (gpa4 < gpaReq - 0.3) {
      successRate = Math.max(5, Math.floor(successRate * 0.3));
    }

    results.push({
      uni_name: prog.uni_name,
      uni_name_en: prog.name_en,
      uni_type: prog.uni_type === 'public' ? '公立' : prog.uni_type === 'private' ? '私立' : '海外分校',
      qs_ranking: prog.qs_ranking || '未上榜',
      city: prog.city,
      program_name: prog.name,
      level: prog.level === 'bachelor' ? '本科' : prog.level === 'master' ? '硕士' : '博士',
      duration: prog.duration_years,
      tuition_total: prog.tuition_total,
      living_cost_total: prog.living_cost * prog.duration_years,
      service_fee: prog.service_fee,
      total_cost: totalCost,
      yearly_cost: Math.round(yearlyTotal),
      ielts_req: ieltsReq,
      gpa_req: gpaReq,
      special_req: prog.special_req,
      score,
      success_rate: successRate,
      reasons,
      warnings,
      intake: JSON.parse(prog.intake),
      apply_months: prog.apply_months,
      uni_desc: prog.uni_desc,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 10);
}

// ============ API路由 ============

// 匹配推荐
app.post('/api/match', (req, res) => {
  const student = req.body;
  const results = matchUniversities(student);

  // 保存咨询记录
  db.prepare(`
    INSERT INTO inquiries (name, phone, wechat, education, gpa, ielts, budget, target_level, target_major, preferences, results)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    student.name, student.phone, student.wechat, student.education,
    student.gpa, student.ielts, student.budget, student.targetLevel,
    student.targetMajor, JSON.stringify(student.preferences), JSON.stringify(results)
  );

  res.json({ success: true, results, gpa4: student.gpa > 4 ? convertGpa(student.gpa) : student.gpa });
});

function convertGpa(gpa) {
  if (gpa >= 90) return 3.7;
  if (gpa >= 85) return 3.5;
  if (gpa >= 80) return 3.3;
  if (gpa >= 75) return 3.0;
  if (gpa >= 70) return 2.7;
  if (gpa >= 65) return 2.3;
  if (gpa >= 60) return 2.0;
  return 1.5;
}

// 获取所有大学列表
app.get('/api/universities', (req, res) => {
  const unis = db.prepare('SELECT * FROM universities ORDER BY qs_ranking ASC').all();
  res.json(unis);
});

// 获取咨询记录
app.get('/api/inquiries', (req, res) => {
  const list = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 100').all();
  res.json(list);
});

// 获取统计信息
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM inquiries').get().c;
  const today = db.prepare("SELECT COUNT(*) as c FROM inquiries WHERE date(created_at)=date('now')").get().c;
  const topMajors = db.prepare(`
    SELECT target_major, COUNT(*) as c FROM inquiries
    WHERE target_major IS NOT NULL GROUP BY target_major ORDER BY c DESC LIMIT 5
  `).all();
  res.json({ total, today, topMajors });
});

app.listen(PORT, () => {
  console.log(`🎓 赴马教育匹配系统运行在 http://localhost:${PORT}`);
});
