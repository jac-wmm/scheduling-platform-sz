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

		return (
			<div id='analysis-panel'>
				<h4>"{highlightedTaskType}"专项分析</h4>
				{/* 这里可以添加更详细的分析内容 */}
				<div className='analysis-section'>
					<strong>按{currentView === 'annual' ? '月份' : '日期'}分布</strong>
					{/* 分析数据将在这里显示 */}
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
