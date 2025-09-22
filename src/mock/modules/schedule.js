import Mock from 'mockjs';
import { TASK_DEFS, VEHICLES, TASK_CATEGORIES } from './common';
// 引入文件系统模块，用于读取JSON文件
import fs from 'fs';
import path from 'path';

// 生成年度数据（返回对象数组格式）
export const generateAnnualData = (year, taskTypes = []) => {
	const tasks = [];
	
	// 如果没有指定任务类型，则使用所有类型
	const selectedTypes = taskTypes.length > 0 ? taskTypes : TASK_CATEGORIES;
	
	// 根据任务类型筛选任务定义
	const filteredTaskDefs = Object.keys(TASK_DEFS).filter(code => 
		selectedTypes.includes(TASK_DEFS[code].type)
	);

	for (let m = 0; m < 12; m++) {
		VEHICLES.forEach((v) => {
			// 根据月份和车辆ID生成相对固定数量的任务，避免完全随机
			// 这样可以保证不同车辆在不同月份有合理的任务分布
			const baseTasks = Math.floor((v.charCodeAt(2) + m) % 3) + 1; // 1-3个基础任务
			let tasksToAssign = Math.floor(Math.random() * 2) + baseTasks; // 额外随机0-1个任务
			
			for (let i = 0; i < tasksToAssign; i++) {
				// 从筛选后的任务定义中随机选择
				const taskCode = filteredTaskDefs[Math.floor(Math.random() * filteredTaskDefs.length)];
				const taskDef = TASK_DEFS[taskCode];

				if (taskDef) {
					tasks.push({
						year,
						month: m,
						vehicle: v,
						taskType: taskDef.type,
						taskCode,
						manHours: taskDef.manHours,
						// 添加额外的属性使数据更丰富
						priority: Math.floor(Math.random() * 3) + 1, // 1-3优先级
						status: Math.random() > 0.7 ? '已完成' : '未开始', // 模拟部分任务已完成
						assignedWorkers: Math.floor(Math.random() * 4) + 1, // 1-4个工人
						estimatedDays: Math.ceil(taskDef.manHours / 8), // 预估天数（8小时/天）
					});
				}
			}
		});
	}

	return tasks;
};

// 生成月度数据（返回对象数组格式）
export const generateMonthlyData = (year, month, taskTypes = []) => {
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const monthlyTasks = [];

	// 先生成年度数据
	const annualTasks = generateAnnualData(year, taskTypes);
	// 筛选当月的任务
	const tasksForMonth = annualTasks.filter(task => task.month === month);

	// 为每个任务分配具体日期
	tasksForMonth.forEach((task) => {
		// 基于任务优先级设置日期分布，优先级高的任务安排在月初
		const baseDay = Math.floor((task.priority - 1) * (daysInMonth / 3));
		const randomOffset = Math.floor(Math.random() * Math.floor(daysInMonth / 3));
		const day = Math.min(baseDay + randomOffset + 1, daysInMonth);
		
		monthlyTasks.push({
			...task,
			day,
			taskDef: TASK_DEFS[task.taskCode],
			// 添加更多月度视图需要的属性
			actualManHours: task.manHours * (0.8 + Math.random() * 0.4), // 实际工时（80%-120%）
			completionRate: task.status === '已完成' ? 100 : Math.floor(Math.random() * 30), // 完成率
			startTime: `0${Math.floor(Math.random() * 3) + 8}:00`.slice(-5), // 开始时间 8:00-10:00
			endTime: `1${Math.floor(Math.random() * 7) + 2}:00`.slice(-5) // 结束时间 12:00-18:00
		});
	});

	// 按日期排序
	return monthlyTasks.sort((a, b) => a.day - b.day);
};

const scheduleMock = [
	{
		url: '/api/schedule/annual',
		response: ({ query }) => {
			const { year, types } = query;
			const selectedYear = parseInt(year) || new Date().getFullYear();
			const taskTypes = types ? types.split(',') : [];

			try {
				// 构建JSON文件路径
				const jsonFilePath = path.join(__dirname, `jsonData/${selectedYear}.json`);
				console.log('jsonFilePath', jsonFilePath);
				
				// 检查文件是否存在
				if (fs.existsSync(jsonFilePath)) {
					// 读取并解析JSON文件
					const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
					// 如果有指定任务类型，则进行过滤
					const filteredData = taskTypes.length > 0 
						? jsonData.filter(task => taskTypes.includes(task.taskType))
						: jsonData;
					return {
						code: 200,
						data: filteredData,
						message: `获取${selectedYear}年度数据成功（从文件读取）`,
					};
				} else {
					// 文件不存在时，返回空数据
					return {
						code: 200,
						data: [],
						message: `暂无数据`,
					};
				}
			} catch (error) {
				console.error('读取JSON文件失败:', error);
				// 出错时，返回空数据
				return {
					code: 200,
					data: [],
					message: `暂无数据`,
				};
			}
		},
	},
	{
		url: '/api/schedule/monthly',
		response: ({ query }) => {
			const { year, month, types } = query;
			const selectedYear = parseInt(year);
			const selectedMonth = parseInt(month);
			const taskTypes = types ? types.split(',') : [];
			console.log('selectedMonth',month, selectedMonth);
			

			try {
				// 构建JSON文件路径
				const jsonFilePath = path.join(__dirname, `jsonData/${selectedYear}-${selectedMonth}.json`);
				console.log('jsonFilePath', jsonFilePath);
				
				// 检查文件是否存在
				if (fs.existsSync(jsonFilePath)) {
					// 读取并解析JSON文件
					const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
					// 如果有指定任务类型，则进行过滤
					const filteredData = taskTypes.length > 0 
						? jsonData.filter(task => taskTypes.includes(task.taskType))
						: jsonData;
						
					return {
						code: 200,
						data: filteredData,
						message: `获取${selectedYear}年${selectedMonth + 1}月数据成功（从文件读取）`,
					};
				} else {
					// 文件不存在时，返回空数据
					return {
						code: 200,
						data: [],
						message: `文件不存在，暂无数据`,
					};
				}
			} catch (error) {
				console.error('读取JSON文件失败:', error);
				// 出错时，返回空数据
				return {
					code: 200,
					data: [],
					message: `读取JSON文件失败，暂无数据`,
				};
			}
		},
	},
	{
		url: '/api/schedule/monthly/update',
		method: 'post',
		response: ({ body }) => {
			const { vehicle, day, newTaskCode, year, month } = body;
			// 这里应该有实际的更新逻辑，但我们暂时只是返回成功
			return {
				code: 200,
				data: {
					success: true,
					vehicle,
					day,
					newTaskCode,
				},
				message: '更新月度任务成功',
			};
		},
	},
	{
		url: '/api/schedule/annual/update',
		method: 'post',
		response: ({ body }) => {
			const { vehicle, month, taskType, taskIndex, newTaskCode, year } = body;
			// 这里应该有实际的更新逻辑，但我们暂时只是返回成功
			return {
				code: 200,
				data: {
					success: true,
					vehicle,
					month,
					taskType,
					taskIndex,
					newTaskCode,
				},
				message: '更新年度任务成功',
			};
		},
	},
];

export default scheduleMock;
