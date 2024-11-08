const express = require('express');
const workerController = require('../controllers/actions_with_the_database');

const router = express.Router();

router.get('/workers', workerController.getWorkers); // Получение всех работников
router.get('/workers/department/:departmentName', workerController.getWorkersByDepartment); // Получение работников по отделу
router.get('/workers/position/:positionName', workerController.getWorkersByPosition); // Получение работников по должности
router.get('/workers/fullname/:lastName/:firstName/:middleName', workerController.getWorkerByFullName); // Получение работника по ФИО
router.post('/workers', workerController.addWorker); // Добавление нового работника
router.put('/workers/:workerId', workerController.updateWorker); // Обновление данных работника
router.delete('/workers/:workerId', workerController.dismissWorker); // Увольнение работника (если требуется)
router.get('/workers/:workerId', workerController.getWorkerById); // Получение работника по ID

module.exports = router;
