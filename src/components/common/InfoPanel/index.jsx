import { useContext, useEffect } from 'react';
import { ScheduleContext } from '../../../context/ScheduleContext';
import './index.css';

const InfoPanel = () => {
	const { currentView, currentYear, currentMonth, annualData, monthlyData, highlightedTaskType, TASK_CATEGORIES } = useContext(ScheduleContext);

	// 计算统计信息
	const getStats = () => {
		if (currentView === 'annual' && annualData.schedule) {
			let totalTasks = 0;
			let T = 0,
				J = 0,
				Z = 0;
			let maxHours = 0;
			let busiestMonth = '';

			for (let m = 0; m < 12; m++) {
				const monthKey = `${currentYear}-${m}`;
				const monthData = annualData.schedule[monthKey];

				if (monthData) {
					Object.values(monthData).forEach((vehicleData) => {
						Object.values(vehicleData).forEach((tasks) => {
							tasks.forEach((task) => {
								totalTasks++;
								if (task.startsWith('T')) T++;
								else if (task.startsWith('J')) J++;
								else if (task.startsWith('Z')) Z++;
							});
						});
					});
				}

				// 计算每月总工时
				const monthHours = Object.values(annualData.monthlyManHours[m] || {}).reduce((sum, val) => sum + val, 0);

				if (monthHours > maxHours) {
					maxHours = Math.round(monthHours);
					busiestMonth = `${m + 1}月`;
				}
			}

			return {
				title: `${currentYear}年 计划概览`,
				totalTasks,
				T,
				J,
				Z,
				busiestPeriod: busiestMonth,
				maxHours,
			};
		} else if (currentView === 'monthly' && monthlyData.schedule) {
			let totalTasks = Object.keys(monthlyData.schedule).length;
			let T = 0,
				J = 0,
				Z = 0;
			let maxHours = 0;
			let busiestDay = '';

			Object.values(monthlyData.schedule).forEach(({ code }) => {
				if (code.startsWith('T')) T++;
				else if (code.startsWith('J')) J++;
				else if (code.startsWith('Z')) Z++;
			});

			// 计算每日总工时
			Object.entries(monthlyData.dailyManHours).forEach(([day, hoursByType]) => {
				const dayHours = Object.values(hoursByType).reduce((sum, val) => sum + val, 0);

				if (dayHours > maxHours) {
					maxHours = Math.round(dayHours);
					busiestDay = `${day}日`;
				}
			});

			return {
				title: `${currentYear}年 ${currentMonth + 1}月 计划概览`,
				totalTasks,
				T,
				J,
				Z,
				busiestPeriod: busiestDay,
				maxHours,
			};
		}

		return {
			title: '计划概览',
			totalTasks: 0,
			T: 0,
			J: 0,
			Z: 0,
			busiestPeriod: 'N/A',
			maxHours: 0,
		};
	};

	// 生成任务类型分析
	const renderTaskAnalysis = () => {
		if (!highlightedTaskType) return null;

		// 计算工时Top 5的月份/日期
		let timeList = [];
		if (currentView === 'annual' && annualData.monthlyManHours) {
			// 年度视图：按月份统计高亮任务类型的工时
			for (let month = 0; month < 12; month++) {
				if (annualData.monthlyManHours[month] && annualData.monthlyManHours[month][highlightedTaskType] !== undefined) {
					const hours = annualData.monthlyManHours[month][highlightedTaskType];
					if (hours > 0) {
						timeList.push({
							label: `${month + 1}月`,
							hours: hours
						});
					}
				}
			}
		} else if (currentView === 'monthly' && monthlyData.dailyManHours) {
			// 月度视图：按日期统计高亮任务类型的工时
			for (const [day, hoursByType] of Object.entries(monthlyData.dailyManHours)) {
				if (hoursByType[highlightedTaskType] !== undefined && hoursByType[highlightedTaskType] > 0) {
					timeList.push({
						label: `${day}日`,
						hours: hoursByType[highlightedTaskType]
					});
				}
			}
		}

		// 排序并取Top 5
		timeList.sort((a, b) => b.hours - a.hours);
		timeList = timeList.slice(0, 5);

		// 计算工时Top 5的车辆
		let vehicleList = [];
		if (currentView === 'annual' && annualData.schedule) {
			// 年度视图：按车辆统计高亮任务类型的工时
			const vehicleHours = {};
			for (let m = 0; m < 12; m++) {
				const monthKey = `${currentYear}-${m}`;
				const monthData = annualData.schedule[monthKey];
				if (monthData) {
					Object.entries(monthData).forEach(([vehicle, tasksByType]) => {
						if (tasksByType[highlightedTaskType]) {
							vehicleHours[vehicle] = (vehicleHours[vehicle] || 0) + tasksByType[highlightedTaskType].length;
						}
					});
				}
			}

			// 转换为数组格式
			vehicleList = Object.entries(vehicleHours).map(([vehicle, count]) => ({
				label: vehicle,
				hours: count
			})).sort((a, b) => b.hours - a.hours).slice(0, 5);
		} else if (currentView === 'monthly' && monthlyData.schedule) {
			// 月度视图：按车辆统计高亮任务类型的工时
			const vehicleHours = {};
			Object.entries(monthlyData.schedule).forEach(([key, taskInfo]) => {
				const [vehicle] = key.split('-');
				// 检查是否有多个任务代码
				const taskCodes = taskInfo.codes || [taskInfo.code];
				// 过滤出高亮任务类型的任务
				taskCodes.forEach(code => {
					if (taskInfo.def && taskInfo.def.type === highlightedTaskType) {
						vehicleHours[vehicle] = (vehicleHours[vehicle] || 0) + (taskInfo.def.manHours || 1);
					}
				});
			});

			// 转换为数组格式
			vehicleList = Object.entries(vehicleHours).map(([vehicle, hours]) => ({
				label: vehicle,
				hours: hours
			})).sort((a, b) => b.hours - a.hours).slice(0, 5);
		}

		return (
			<div id='analysis-panel'>
				<h4>"{highlightedTaskType}"专项分析</h4>
				<div className='analysis-section'>
					<strong>按{currentView === 'annual' ? '月份' : '日期'} (工时Top 5):</strong>
					<ul className='analysis-list'>
						{timeList.length > 0 ? (
							timeList.map((item, index) => (
								<li key={index}>{item.label}: {item.hours.toFixed(2)}小时</li>
							))
						) : (
							<li>无数据</li>
						)}
					</ul>
				</div>
				<div className='analysis-section'>
					<strong>按车辆 (工时Top 5):</strong>
					<ul className='analysis-list'>
						{vehicleList.length > 0 ? (
							vehicleList.map((item, index) => (
								<li key={index}>{item.label}: {item.hours.toFixed(2)}小时</li>
							))
						) : (
							<li>无数据</li>
						)}
					</ul>
				</div>
			</div>
		);
	};

	const stats = getStats();

	return (
		<div id='info-panel'>
			<h3>{stats.title}</h3>
			<div className='stat-item'>
				<span>总任务数:</span>
				<span>{stats.totalTasks}</span>
			</div>
			<div className='stat-item'>
				<span>均衡修(T):</span>
				<span>{stats.T}</span>
			</div>
			<div className='stat-item'>
				<span>特别修(J):</span>
				<span>{stats.J}</span>
			</div>
			<div className='stat-item'>
				<span>专项修(Z):</span>
				<span>{stats.Z}</span>
			</div>
			<div className='stat-item'>
				<span>最繁忙{currentView === 'annual' ? '月份' : '日期'}:</span>
				<span>
					{stats.busiestPeriod} ({stats.maxHours}h)
				</span>
			</div>

			{renderTaskAnalysis()}
		</div>
	);
};

export default InfoPanel;
