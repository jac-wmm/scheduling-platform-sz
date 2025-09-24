import React, { createContext, useState, useEffect, useMemo } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import request from '../utils/request';
import { ta } from 'date-fns/locale';
// 导入antd组件
import { Modal, Input, Progress, message } from 'antd';
// 导入模拟数据生成函数
import { generateAnnualData, generateMonthlyData } from '../mock/modules/schedule';

// 创建上下文
export const ScheduleContext = createContext();

// 月份选项
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
	label: `${i + 1}月`,
	value: i,
}));

// 当前年份前后5年的选项
const getYearOptions = () => {
	const currentYear = new Date().getFullYear();
	return Array.from({ length: 11 }, (_, i) => ({
		label: `${currentYear - 5 + i}年`,
		value: currentYear - 5 + i,
	}));
};

export const ScheduleProvider = ({ children }) => {
	// 状态管理
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
	const [currentMonth, setCurrentMonth] = useState(null);
	const [currentView, setCurrentView] = useState('annual'); // 'annual' 或 'monthly'
	const [annualData, setAnnualData] = useState({});
	const [monthlyData, setMonthlyData] = useState({});
	const [highlightedTaskType, setHighlightedTaskType] = useState(null);
	const [chatMessages, setChatMessages] = useState([{ type: 'model', content: '你好！你可以向我提问或发出指令。点击 "?" 查看样例。' }]);
	const [schedulingContext, setSchedulingContext] = useState(null); // 新增schedulingContext状态
	const [TASK_DEFS, setTaskDefs] = useState({});
	const [VEHICLES, setVehicles] = useState([]);
	const [TASK_CATEGORIES, setTaskCategories] = useState([]);
	const [isClickCanvasCard, setIsClickCanvasCard] = useState(false);// 是否点击预排结果卡片，点击卡片对应年月数据不走接口

	// 移除预排功能相关状态

	// 已有的transformAnnualData和transformMonthlyData函数
	const transformTaskDefs = (taskDefsArray) => {
		// 将对象数组转换为组件需要的对象格式
		return taskDefsArray.reduce((acc, task) => {
			acc[task.code] = { type: task.type, manHours: task.manHours };
			return acc;
		}, {});
	};

	const transformVehicles = (vehiclesArray) => {
		// 将对象数组转换为组件需要的字符串数组格式
		return vehiclesArray.map((vehicle) => vehicle.id);
	};

	const transformTaskCategories = (categoriesArray) => {
		// 将对象数组转换为组件需要的字符串数组格式
		return categoriesArray.map((category) => category.name);
	};

	// 加载通用数据
	useEffect(() => {
		loadCommonData();
	}, []);

	// 加载通用数据
	const loadCommonData = async () => {
		try {
			const [taskDefsRes, vehiclesRes, categoriesRes] = await Promise.all([request.get('/common/task-defs'), request.get('/common/vehicles'), request.get('/common/task-categories')]);

			// 在组件内部进行数据转换
			setTaskDefs(transformTaskDefs(taskDefsRes));
			setVehicles(transformVehicles(vehiclesRes));
			setTaskCategories(transformTaskCategories(categoriesRes));
		} catch (error) {
			console.error('加载通用数据失败:', error);
		}
	};

	// 初始化数据
	useEffect(() => {
		if (Object.keys(TASK_DEFS).length > 0 && VEHICLES.length > 0 && TASK_CATEGORIES.length > 0) {
			// 点击预排结果卡片，不加载年度数据
			if (!isClickCanvasCard) {
				loadAnnualData(currentYear);
			}
		}
	}, [currentYear, TASK_DEFS, VEHICLES, TASK_CATEGORIES, isClickCanvasCard]);

	// 当切换月份时加载月度数据
	useEffect(() => {
		if (currentMonth !== null && Object.keys(annualData).length > 0) {
			// 点击预排结果卡片，不加载月度数据
			if (!isClickCanvasCard) {
				console.log('currentMonth', currentMonth);
				loadMonthlyData(currentYear, currentMonth);
			}
		}
	}, [currentMonth, annualData, currentYear, isClickCanvasCard]);

	// 转换年度数据（对象数组 -> 组件需要的格式）
	const transformAnnualData = (annualTasks) => {
		const data = { schedule: {}, monthlyManHours: {}, monthlySummary: {}, allMonthTasks: {} };

		// 初始化结构
		for (let m = 0; m < 12; m++) {
			const monthKey = `${currentYear}-${m}`;
			data.schedule[monthKey] = {};
			data.monthlyManHours[m] = Object.fromEntries(TASK_CATEGORIES.map((t) => [t, 0]));
			data.monthlySummary[m] = { J: 0, Z1: 0, Z2: 0, Z3: 0, Z5: 0, Z6: 0, Z7: 0, T1: 0, T2: 0, T3: 0 };
			data.allMonthTasks[m] = [];
		}

		// 填充数据
		annualTasks.forEach((task) => {
			const monthKey = `${task.year}-${task.month}`;

			// 确保 monthKey 和 vehicle 对应的结构存在
			if (!data.schedule[monthKey]) {
				data.schedule[monthKey] = {};
			}
			if (!data.schedule[monthKey][task.vehicle]) {
				data.schedule[monthKey][task.vehicle] = { 均衡修: [], 特别修: [], 专项修: [] };
			}

			// 确保 taskType 对应的数组存在
			if (!data.schedule[monthKey][task.vehicle][task.taskType]) {
				data.schedule[monthKey][task.vehicle][task.taskType] = [];
			}

			// 现在可以安全地 push 任务代码了
			data.schedule[monthKey][task.vehicle][task.taskType].push(task.taskCode);
			data.monthlyManHours[task.month][task.taskType] += task.manHours;
			data.allMonthTasks[task.month].push({
				vehicle: task.vehicle,
				task: task.taskCode,
				def: TASK_DEFS[task.taskCode],
			});

			const summaryKey = task.taskCode.startsWith('J') ? 'J' : task.taskCode;
			if (data.monthlySummary[task.month][summaryKey] !== undefined) {
				data.monthlySummary[task.month][summaryKey]++;
			}
		});

		return data;
	};

	// 转换月度数据（对象数组 -> 组件需要的格式）
	const transformMonthlyData = (monthlyTasks) => {
		const data = {
			schedule: {},
			dailyManHours: {},
			vehicleSummary: {},
		};

		const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

		// 初始化每日工时统计
		for (let i = 1; i <= daysInMonth; i++) {
			data.dailyManHours[i] = Object.fromEntries(TASK_CATEGORIES.map((t) => [t, 0]));
		}

		// 初始化车辆统计
		VEHICLES.forEach((v) => {
			data.vehicleSummary[v] = Object.fromEntries(TASK_CATEGORIES.map((t) => [t, 0]));
		});

		// 填充数据 - 修改为支持同一天同一辆车多个任务
		monthlyTasks.forEach((task) => {
			const key = `${task.vehicle}-${task.day}`;

			// 检查是否已存在该车辆该日期的任务数据
			if (data.schedule[key]) {
				// 如果已存在，将新任务添加到现有任务列表
				if (!data.schedule[key].codes) {
					// 转换现有的单个任务为数组
					data.schedule[key].codes = [data.schedule[key].code];
					// 保留第一个任务的def作为代表性定义
				}
				// 添加新任务代码
				data.schedule[key].codes.push(task.taskCode);
			} else {
				// 如果不存在，创建新的任务数据对象
				data.schedule[key] = {
					code: task.taskCode, // 保留单个code属性以保持向后兼容
					codes: [task.taskCode], // 添加codes数组以支持多个任务
					def: task.taskDef, // 使用第一个任务的def作为代表性定义
				};
			}

			// data.dailyManHours[task.day][task.taskType] += task.manHours;
			// data.vehicleSummary[task.vehicle][task.taskType]++;

			if (data.dailyManHours[task.day] && data.dailyManHours[task.day][task.taskType] !== undefined) {
				data.dailyManHours[task.day][task.taskType] += task.manHours || 0;
			}

			if (data.vehicleSummary[task.vehicle] && data.vehicleSummary[task.vehicle][task.taskType] !== undefined) {
				data.vehicleSummary[task.vehicle][task.taskType]++;
			}
		});

		return data;
	};

	// 从接口加载年度数据
	const loadAnnualData = async (year) => {
		try {
			const res = await request.get('/schedule/annual', { params: { year } });
			// 转换数据格式
			setAnnualData(transformAnnualData(res));
		} catch (error) {
			console.error('加载年度数据失败:', error);
		}
	};

	// 从接口加载月度数据
	const loadMonthlyData = async (year, month) => {
		try {
			const res = await request.get('/schedule/monthly', { params: { year, month } });
			// 转换数据格式
			setMonthlyData(transformMonthlyData(res));
		} catch (error) {
			console.error('加载月度数据失败:', error);
		}
	};

	// 更新月度计划单元格
	const updateMonthlySchedule = async (vehicle, day, newTaskCode) => {
		try {
			const res = await request.post('/schedule/monthly/update', {
				vehicle,
				day,
				newTaskCode,
				year: currentYear,
				month: currentMonth,
			});

			// 更新成功后重新加载数据
			if (res.success) {
				await loadMonthlyData(currentYear, currentMonth);
			}
		} catch (error) {
			console.error('更新月度计划失败:', error);
		}
	};

	// 更新年度计划单元格
	const updateAnnualSchedule = async (vehicle, month, taskType, taskIndex, newTaskCode) => {
		try {
			const res = await request.post('/schedule/annual/update', {
				vehicle,
				month,
				taskType,
				taskIndex,
				newTaskCode,
				year: currentYear,
			});

			// 更新成功后重新加载数据
			if (res.success) {
				await loadAnnualData(currentYear);
			}
		} catch (error) {
			console.error('更新年度计划失败:', error);
		}
	};

	// 导入数据
	const importData = () => {
		// 创建文件输入元素
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.xlsx, .xls';

		input.onchange = (e) => {
			const file = e.target.files[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					const data = new Uint8Array(event.target.result);
					const workbook = XLSX.read(data, { type: 'array' });
					const firstSheetName = workbook.SheetNames[0];
					const worksheet = workbook.Sheets[firstSheetName];
					const jsonData = XLSX.utils.sheet_to_json(worksheet);

					// 这里可以根据实际Excel格式处理数据
					alert(`成功导入 ${jsonData.length} 条数据`);
				} catch (error) {
					alert('导入失败: ' + error.message);
				}
			};
			reader.readAsArrayBuffer(file);
		};

		input.click();
	};

	// 导出数据
	const exportData = () => {
		try {
			let data, fileName;

			if (monthlyData.schedule) {
				// 准备月度数据导出
				data = [];
				Object.entries(monthlyData.schedule).forEach(([key, taskInfo]) => {
					const [vehicle, day] = key.split('-');
					data.push({
						年份: currentYear,
						月份: currentMonth + 1,
						日期: day,
						车号: vehicle,
						任务代码: taskInfo.code,
						任务类型: taskInfo.def.type,
						工时: taskInfo.def.manHours,
					});
				});
				fileName = `月度排程数据_${currentYear}年${currentMonth + 1}月.xlsx`;
			} else if (annualData.schedule) {
				// 准备年度数据导出
				data = [];
				Object.entries(annualData.schedule).forEach(([monthKey, monthData]) => {
					const [year, month] = monthKey.split('-');
					Object.entries(monthData).forEach(([vehicle, tasksByType]) => {
						Object.entries(tasksByType).forEach(([taskType, taskCodes]) => {
							taskCodes.forEach((taskCode) => {
								const taskDef = TASK_DEFS[taskCode];
								data.push({
									年份: year,
									月份: parseInt(month) + 1,
									车号: vehicle,
									任务类型: taskType,
									任务代码: taskCode,
									工时: taskDef?.manHours || 0,
								});
							});
						});
					});
				});
				fileName = `年度排程数据_${currentYear}年.xlsx`;
			} else {
				alert('没有可导出的数据');
				return;
			}

			const worksheet = XLSX.utils.json_to_sheet(data);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, '排程数据');
			const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
			const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
			saveAs(blob, fileName);
		} catch (error) {
			alert('导出失败: ' + error.message);
		}
	};

	// 发送聊天消息
	const sendChatMessage = (message) => {
		if (!message.trim()) return;
		// 添加用户消息
		setChatMessages((prev) => [...prev, { type: 'user', content: message }]);

		// 模拟AI回复
		setTimeout(() => {
			let response;
			const text = message;
			const lowerCaseText = text.toLowerCase();

			// 帮助命令
			if (text.includes('帮助') || text === '?' || text === '？') {
				response = `您可以尝试以下指令：<br>
				<ul>
					<li><b>预排2026年计划</b> - 生成新的年度计划</li>
					<li><b>先排2025年8月的均衡修</b> - 分步排程</li>
					<li><b>高亮特别修</b> - 高亮并分析特定修程</li>
					<li><b>切换到5月</b> - 查看当前年份的指定月份</li>
					<li><b>今年有多少任务?</b> - 查询当前视图总任务数</li>
				</ul>`;
			}
			// 高亮任务命令
			else if (text.includes('高亮') && (text.includes('均衡修') || text.includes('特别修') || text.includes('专项修'))) {
				const taskType = text.includes('均衡修') ? '均衡修' : text.includes('特别修') ? '特别修' : '专项修';
				setHighlightedTaskType(taskType);
				response = `好的，已高亮所有"${taskType}"任务，并在左侧面板生成了专项分析报告。`;
			}
			// 切换到年度视图
			else if (lowerCaseText.includes('年视图') || lowerCaseText.includes('年度计划')) {
				setHighlightedTaskType(null); // 取消高亮
				setCurrentView('annual');
				response = '好的，已返回年度计划视图。';
			}
			// 切换到月度视图
			else if (lowerCaseText.includes('月视图') || lowerCaseText.includes('月度计划')) {
				setHighlightedTaskType(null); // 取消高亮
				setCurrentView('monthly');
				response = '好的，已切换到月度计划视图。';
			}
			// 切换年份
			else if (lowerCaseText.match(/\d{4}/)) {
				setHighlightedTaskType(null); // 取消高亮
				const yearMatch = lowerCaseText.match(/(\d{4})/);
				if (yearMatch) {
					const year = parseInt(yearMatch[1], 10);
					setCurrentYear(year);
					setCurrentView('annual');
					response = `好的，已切换到 ${year} 年的年度计划视图。`;
				}
			}
			// 切换月份
			else if (lowerCaseText.includes('月')) {
				const monthMatch = lowerCaseText.match(/(\d{1,2})月/);
				if (monthMatch) {
					const month = parseInt(monthMatch[1], 10);
					if (month >= 1 && month <= 12) {
						setCurrentMonth(month - 1);
						setCurrentView('monthly');
						response = `好的，已切换到 ${month} 月的计划视图。`;
					}
				}
				setHighlightedTaskType(null); // 取消高亮
			}
			// 查询任务数量
			else if (lowerCaseText.includes('多少任务') || lowerCaseText.includes('任务总数')) {
				setHighlightedTaskType(null); // 取消高亮
				// 模拟获取统计数据
				let totalTasks = 0;
				if (lowerCaseText.includes('年') || currentView === 'annual') {
					for (let m = 0; m < 12; m++) {
						const tasksInMonth = annualData.schedule[`${currentYear}-${m}`];
						if (tasksInMonth) {
							totalTasks += Object.values(tasksInMonth)
								.flatMap((v) => Object.values(v))
								.flat().length;
						}
					}
				} else {
					totalTasks = Object.keys(monthlyData.schedule).length;
				}
				const viewText = currentView === 'annual' ? '本年度' : '本月';
				response = `根据当前视图，${viewText}共有 ${totalTasks} 个任务。`;
			}
			// 查询最忙时期
			else if (lowerCaseText.includes('最忙') || lowerCaseText.includes('最繁忙')) {
				setHighlightedTaskType(null); // 取消高亮
				// 根据实际数据计算最忙时期
				const periodText = currentView === 'annual' ? '月份' : '日期';
				let busiestPeriod = '';
				let maxHours = 0;

				if (currentView === 'annual' && annualData.monthlyManHours) {
					// 计算年度视图中最忙的月份
					for (let month = 0; month < 12; month++) {
						if (annualData.monthlyManHours[month]) {
							const totalHours = Object.values(annualData.monthlyManHours[month]).reduce((sum, hours) => sum + hours, 0);
							if (totalHours > maxHours) {
								maxHours = totalHours;
								busiestPeriod = `${month + 1}月`;
							}
						}
					}
				} else if (currentView === 'monthly' && monthlyData.dailyManHours) {
					// 计算月度视图中最忙的日期
					for (const [day, hoursByType] of Object.entries(monthlyData.dailyManHours)) {
						const totalHours = Object.values(hoursByType).reduce((sum, hours) => sum + hours, 0);
						if (totalHours > maxHours) {
							maxHours = totalHours;
							busiestPeriod = `${day}日`;
						}
					}
				}

				// 如果没有找到有效数据，使用默认值
				if (!busiestPeriod) {
					busiestPeriod = currentView === 'annual' ? '6月' : '15日';
					maxHours = 0;
				}

				response = `当前视图中最繁忙的${periodText}是 ${busiestPeriod}，总工时约为 ${maxHours.toFixed(2)} 小时。`;
			}
			// 初始预排计划命令
			else if (text.includes('预排') || text.includes('先排') || text.includes('只排')) {
				setHighlightedTaskType(null); // 取消高亮
				// 使用正则表达式提取信息，与demo保持一致
				const preScheduleMatch = text.match(/(预排|先排|只排)(\d{4}年)?(\d{1,2}月)?(的)?(均衡修|特别修|专项修)/);

				if (preScheduleMatch) {
					// 提取年份、月份和任务类型
					const year = preScheduleMatch[2] ? preScheduleMatch[2].replace('年', '') : currentYear;
					const month = preScheduleMatch[3] ? parseInt(preScheduleMatch[3].replace('月', ''), 10) - 1 : -1;
					const type = preScheduleMatch[5];

					// 设置排程上下文
					setSchedulingContext({ year, month, scheduledTypes: [type] });

					// 添加可视化卡片
					const canvasContent = `
						<div class="canvas-card" data-action="apply-plan" data-year="${year}" data-month="${month}" data-types="${type}">
						<div class="canvas-header">${year}年${month > -1 ? month + 1 + '月' : ''}预排计划</div>
						<div class="canvas-content">
						<p>已选择任务类型: ${type}</p>
						<p>请点击顶部工具栏的"预排年计划"或"预排月计划"按钮生成计划</p>
						<p>您也可以使用"再排XXX"指令继续添加其他任务类型</p>
						<p>生成后可应用到主界面</p>
						</div>
						</div>
						`;
					response = canvasContent;
				} else {
					// 如果正则匹配失败，使用原来的逻辑作为后备
					const yearMatch = text.match(/(\d{4})年/);
					const monthMatch = text.match(/(\d{1,2})月/);
					const year = yearMatch ? parseInt(yearMatch[1], 10) : currentYear;
					const month = monthMatch ? parseInt(monthMatch[1], 10) - 1 : -1;

					const canvasContent = `
						<div class="canvas-card" data-action="apply-plan" data-year="${year}" data-month="${month}">
						<div class="canvas-header">${year}年${month > -1 ? month + 1 + '月' : ''}预排计划</div>
						<div class="canvas-content">
						<p>请点击顶部工具栏的"预排年计划"或"预排月计划"按钮生成计划</p>
						<p>生成后可应用到主界面</p>
						</div>
						</div>
						`;
					response = canvasContent;
				}
			}
			// 分步排程 - 后续排程
			else if (/^(再排|然后排|接着排|继续排)/.test(text) && schedulingContext) {
				setHighlightedTaskType(null); // 取消高亮
				// 提取任务类型
				const typeMatch = text.match(/(均衡修|特别修|专项修)/);
				if (typeMatch) {
					const newType = typeMatch[1];
					const { year, month, scheduledTypes } = schedulingContext;

					if (scheduledTypes.includes(newType)) {
						response = `"${newType}" 已经包含在当前的排程计划中了。`;
					} else {
						const newTypes = [...scheduledTypes, newType];
						setSchedulingContext({ year, month, scheduledTypes: newTypes });

						// 更新可视化卡片
						const canvasContent = `
							<div class="canvas-card" data-action="apply-plan" data-year="${year}" data-month="${month}" data-types="${newTypes.join(',')}">
							<div class="canvas-header">
							<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="#3f51b5"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
							<span>${year}年${month > -1 ? month + 1 + '月' : ''}预排计划</span>
							</div>
							<div class="canvas-content">
							<p>已选择任务类型: ${newTypes.join('、')}</p>
							<p>请点击顶部工具栏的"预排年计划"或"预排月计划"按钮生成计划</p>
							<p>生成后可应用到主界面</p>
							</div>
							</div>
							`;
						response = canvasContent;
					}
				} else {
					response = '请指定要继续排的任务类型（均衡修、特别修或专项修）';
				}
			}
			// 导入数据命令 - 添加清除schedulingContext的逻辑
			else if (text.includes('导入数据')) {
				setSchedulingContext(null); // 导入数据时清除排程上下文
				const canvasContent = `
					<div class="canvas-card" data-action="导入数据" data-year="${currentYear}" data-month="${currentMonth}">
					<div class="canvas-header">数据导入结果</div>
					<div class="canvas-content">
					<p>数据导入成功</p>
					<p>点击此卡片可应用到主界面</p>
					</div>
					</div>
					`;
				response = canvasContent;
			}
			// 默认回复
			else {
				setHighlightedTaskType(null); // 取消高亮
				setSchedulingContext(null); // 默认回复时清除
				response = `抱歉，我暂时无法理解该指令。您可以试试点击 "?" 按钮查看可用指令。`;
			}

			setChatMessages((prev) => [...prev, { type: 'model', content: response }]);
		}, 1000);
	};

	// 提供给上下文的值
	const value = useMemo(
		() => ({
			currentYear,
			setCurrentYear,
			currentMonth,
			setCurrentMonth,
			currentView,
			setCurrentView,
			annualData,
			setAnnualData,
			monthlyData,
			setMonthlyData,
			transformAnnualData,
			transformMonthlyData,
			updateMonthlySchedule,
			updateAnnualSchedule,
			highlightedTaskType,
			setHighlightedTaskType,
			TASK_DEFS,
			VEHICLES,
			TASK_CATEGORIES,
			importData,
			exportData,
			// 移除预排计划函数引用，这些函数现在由TopToolbar内部实现
			chatMessages,
			sendChatMessage,
			setChatMessages,
			setIsClickCanvasCard,
			schedulingContext, // 新增
        setSchedulingContext, // 新增
		}),
		[currentYear, currentMonth, currentView, annualData, monthlyData, transformAnnualData, transformMonthlyData, highlightedTaskType, chatMessages, schedulingContext]
	);

	return (
		<ScheduleContext.Provider value={value}>
			{children}
			{/* 移除SchedulingModal组件 */}
		</ScheduleContext.Provider>
	);
};
