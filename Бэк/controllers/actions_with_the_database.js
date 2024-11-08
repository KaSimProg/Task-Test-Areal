const { pool } = require('../config/create_db');

// Для получения всех работников
const getWorkers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.id_worker, w.last_name, w.first_name, w.middle_name, w.birth_date, 
             w.passport, w.contact_info, w.address, w.salary, 
             w.hire_date, d.department_name, s.status_name, p.position_name
      FROM worker w
      JOIN department d ON w.department_id = d.id_department
      JOIN status s ON w.status_id = s.id_status
      JOIN position p ON w.position_id = p.id_position
      WHERE w.status_id = 1
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Для получения работников по отделу
const getWorkersByDepartment = async (req, res) => {
  const { departmentName } = req.params;
  try {
    const result = await pool.query(`
      SELECT w.id_worker, w.last_name, w.first_name, w.middle_name, w.birth_date, 
             w.passport, w.contact_info, w.address, w.salary, 
             w.hire_date, d.department_name, s.status_name, p.position_name
      FROM worker w
      JOIN department d ON w.department_id = d.id_department
      JOIN status s ON w.status_id = s.id_status
      JOIN position p ON w.position_id = p.id_position
      WHERE d.department_name = $1
    `, [departmentName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Работники не найдены в указанном департаменте' });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Для получения работников по профессии
const getWorkersByPosition = async (req, res) => {
  const { positionName } = req.params;
  try {
    const result = await pool.query(`
      SELECT w.id_worker, w.last_name, w.first_name, w.middle_name, w.birth_date, 
             w.passport, w.contact_info, w.address, w.salary, 
             w.hire_date, d.department_name, s.status_name, p.position_name
      FROM worker w
      JOIN department d ON w.department_id = d.id_department
      JOIN status s ON w.status_id = s.id_status
      JOIN position p ON w.position_id = p.id_position
      WHERE p.position_name = $1
    `, [positionName]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Работники с указанной должностью не найдены' });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Для создания нового отдела, если он не существует
const ensureDepartmentExists = async (departmentName) => {
  if (!departmentName) {
    throw new Error("Department name cannot be null or empty");
  }

  const result = await pool.query('SELECT id_department FROM department WHERE department_name = $1', [departmentName]);
  
  if (result.rowCount === 0) {
    const insertResult = await pool.query('INSERT INTO department (department_name) VALUES ($1) RETURNING id_department', [departmentName]);
    return insertResult.rows[0].id_department;
  }
  
  return result.rows[0].id_department;
};


// Для создания нового отдела, если он не существует
const ensurePositionExists = async (positionName) => {
  if (!positionName) {
    throw new Error("Position name cannot be null or empty");
  }

  const result = await pool.query('SELECT id_position FROM position WHERE position_name = $1', [positionName]);
  
  if (result.rowCount === 0) {
    const insertResult = await pool.query('INSERT INTO position (position_name) VALUES ($1) RETURNING id_position', [positionName]);
    return insertResult.rows[0].id_position;
  }
  
  return result.rows[0].id_position;
};
// Функция для создания работника
const addWorker = async (req, res) => {
  const {
    lastName,
    firstName,
    middleName,
    birthDate,
    passport,
    contactInfo,
    address,
    salary,
    hireDate,
    departmentName,
    positionName,
  } = req.body;

  try {
    const departmentId = await ensureDepartmentExists(departmentName);
    const positionId = await ensurePositionExists(positionName);

    const result = await pool.query(`
      INSERT INTO worker (
        last_name, 
        first_name, 
        middle_name, 
        birth_date, 
        passport, 
        contact_info, 
        address, 
        salary, 
        hire_date, 
        department_id, 
        position_id,
        status_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING id_worker
    `, [
      lastName,
      firstName,
      middleName,
      birthDate,
      passport,
      contactInfo,
      address,
      salary,
      hireDate,
      departmentId,
      positionId,
      1 // статус "Работает" для работника
    ]);
    
    const workerId = result.rows[0].id_worker;
    console.log('Новый работник добавлен с ID:', workerId);
    res.status(201).json({ id_worker: workerId, message: 'Работник успешно создан' });
  } catch (error) {
    console.error("Error creating worker", error);
    res.status(500).json({ error: error.message });
  }
};
// Для получения работника по полному ФИО
const getWorkerByFullName = async (req, res) => {
  const { lastName, firstName, middleName } = req.params;
  try {
    const result = await pool.query(`
      SELECT w.id_worker, w.last_name, w.first_name, w.middle_name, w.birth_date, 
             w.passport, w.contact_info, w.address, w.salary, 
             w.hire_date, d.department_name, s.status_name, p.position_name
      FROM worker w
      JOIN department d ON w.department_id = d.id_department
      JOIN status s ON w.status_id = s.id_status
      LEFT JOIN position p ON w.position_id = p.id_position
      WHERE w.last_name = $1 AND w.first_name = $2 AND 
      (w.middle_name = $3 OR w.middle_name IS NULL);
    `, [lastName, firstName, middleName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Работник не найден' });
    }
    
    // Отправляем все найденные записи
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Для обновления работника
const updateWorker = async (req, res) => {
  const { workerId } = req.params;
  const { 
    lastName, firstName, middleName, birthDate, passport, contactInfo, address, salary, hireDate, 
    departmentName, statusId = 1, positionName
  } = req.body;

  try {
    const positionId = await ensurePositionExists(positionName);
    const departmentId = await ensureDepartmentExists(departmentName);

    const result = await pool.query(`
      UPDATE worker
      SET last_name = $1,
          first_name = $2,
          middle_name = $3,
          birth_date = $4,
          passport = $5,
          contact_info = $6,
          address = $7,
          salary = $8,
          hire_date = $9,
          department_id = $10,
          position_id = $11,
          status_id = $12
      WHERE id_worker = $13
      RETURNING id_worker
    `, [
      lastName, firstName, middleName, birthDate, passport, contactInfo, address, salary, hireDate, departmentId, positionId, statusId, workerId
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Работник не найден' });
    }

    res.status(200).json({ message: 'Данные работника успешно обновлены' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const dismissWorker = async (req, res) => {
  const { workerId } = req.params;

  try {
    // Обновляем статус работника на "уволен"
    const result = await pool.query(`
      UPDATE worker
      SET status_id = 2
      WHERE id_worker = $1
      RETURNING id_worker
    `, [workerId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Работник не найден' });
    }

    res.status(200).json({ message: 'Работник успешно уволен' });
  } catch (err) {
    console.error('Ошибка при увольнении работника:', err);
    res.status(500).json({ error: err.message });
  }
};

const getWorkerById = async (req, res) => { 
  const { workerId } = req.params;

  // Проверяем, что workerId является числом
  if (isNaN(workerId)) {
    return res.status(400).json({ message: 'Некорректный ID сотрудника' });
  }

  try {
    const result = await pool.query(`
      SELECT w.id_worker, w.last_name, w.first_name, w.middle_name, w.birth_date, 
             w.passport, w.contact_info, w.address, w.salary, 
             w.hire_date, d.department_name, s.status_name, p.position_name
      FROM worker w
      JOIN department d ON w.department_id = d.id_department
      JOIN status s ON w.status_id = s.id_status
      LEFT JOIN position p ON w.position_id = p.id_position
      WHERE w.id_worker = $1
    `, [workerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Работник не найден' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка при получении данных работника:", err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  getWorkers,
  dismissWorker,
  getWorkersByDepartment,
  getWorkersByPosition,
  addWorker,
  getWorkerByFullName,
  updateWorker,
  getWorkerById,
};
