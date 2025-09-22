import Mock from 'mockjs';

// 任务类型编码及标准工时
const TASK_DEFS_ARRAY = [
	{ code: 'T1', type: '特别修', manHours: 4 },
	{ code: 'T2', type: '特别修', manHours: 6 },
	{ code: 'T3', type: '特别修', manHours: 12 },

	{ code: 'J1', type: '均衡修', manHours: 8 },
	{ code: 'J2', type: '均衡修', manHours: 8 },
	{ code: 'J3', type: '均衡修', manHours: 8 },
	{ code: 'J4', type: '均衡修', manHours: 8 },
	{ code: 'J5', type: '均衡修', manHours: 8 },
	{ code: 'J6', type: '均衡修', manHours: 8 },
	{ code: 'J7', type: '均衡修', manHours: 4 },
	{ code: 'J8', type: '均衡修', manHours: 8 },
	{ code: 'J9', type: '均衡修', manHours: 8 },
	{ code: 'J10', type: '均衡修', manHours: 8 },
	{ code: 'J11', type: '均衡修', manHours: 8 },
	{ code: 'J12', type: '均衡修', manHours: 8 },

	{ code: 'Z1', type: '专项修', manHours: 3 },
	{ code: 'Z2', type: '专项修', manHours: 10 },
	{ code: 'Z3', type: '专项修', manHours: 5 },
	{ code: 'Z4', type: '专项修', manHours: 7 },
	{ code: 'Z5', type: '专项修', manHours: 4 },
	{ code: 'Z6', type: '专项修', manHours: 6 },
	{ code: 'Z7', type: '专项修', manHours: 3 },
];

// 车辆列表
const VEHICLES_ARRAY = Array.from({ length: 35 }, (_, i) => ({
	id: `11${String(i + 1).padStart(2, '0')}`,
	name: `11${String(i + 1).padStart(2, '0')}`,
}));

// 任务类型
const TASK_CATEGORIES_ARRAY = [
	{ id: 1, name: '均衡修' },
	{ id: 2, name: '特别修' },
	{ id: 3, name: '专项修' },
];

// 转换为原始格式数据，供schedule.js使用
const TASK_DEFS = TASK_DEFS_ARRAY.reduce((acc, task) => {
	acc[task.code] = { type: task.type, manHours: task.manHours };
	return acc;
}, {});

const VEHICLES = VEHICLES_ARRAY.map((vehicle) => vehicle.id);

const TASK_CATEGORIES = TASK_CATEGORIES_ARRAY.map((category) => category.name);

const commonMock = [
	{
		url: '/api/common/task-defs',
		response: () => ({ code: 200, data: TASK_DEFS_ARRAY, message: '获取任务标准工时成功' }),
	},
	{
		url: '/api/common/vehicles',
		response: () => ({ code: 200, data: VEHICLES_ARRAY, message: '获取车辆列表成功' }),
	},
	{
		url: '/api/common/task-categories',
		response: () => ({ code: 200, data: TASK_CATEGORIES_ARRAY, message: '获取任务类型成功' }),
	},
];

export default commonMock;
// 导出原始格式数据，供schedule.js使用
export { TASK_DEFS, VEHICLES, TASK_CATEGORIES };
