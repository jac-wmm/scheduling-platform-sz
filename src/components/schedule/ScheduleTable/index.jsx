import { useContext, useRef, useEffect } from 'react';
import { ScheduleContext } from '../../../context/ScheduleContext';
import './index.css';

const ScheduleTable = ({ viewType, year, month, annualData, monthlyData, onCellClick }) => {
	const { VEHICLES, TASK_CATEGORIES, highlightedTaskType } = useContext(ScheduleContext);
	const tooltipRef = useRef(null);
	const tooltipTimeoutRef = useRef(null);
	// console.log('annualData',annualData);
	// 渲染年度视图表格
	const renderAnnualTable = () => {
		if (!annualData.schedule) return null;
		const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
		const summaryHeaders = ['J', 'Z1', 'Z2', 'Z3', 'Z5', 'Z6', 'Z7', 'T1', 'T2', 'T3'];

		// 季度表头
		let tableHtml = `
      <table class="view-annual">
        <thead>
          <tr>
            <th class="sticky-corner sticky-col-1">季度</th>
            <th class="sticky-corner sticky-col-2">月份</th>
            <th class="sticky-corner sticky-col-3">修程</th>
    `;

		// 车辆表头
		VEHICLES.forEach((vehicle) => {
			tableHtml += `<th data-vehicle-col="${vehicle}">${vehicle}</th>`;
		});

		// 汇总表头
		summaryHeaders.forEach((header) => {
			tableHtml += `<th class="summary-col">${header}</th>`;
		});

		tableHtml += `</tr></thead><tbody>`;

		// 表格内容
		for (let m = 0; m < 12; m++) {
			const quarter = Math.floor(m / 3) + 1;
			let isFirstMonthRow = true;

			TASK_CATEGORIES.forEach((taskType) => {
				// 每种修程的行数
				const rowCount = taskType === '均衡修' ? 1 : taskType === '特别修' ? 4 : 7;

				for (let i = 0; i < rowCount; i++) {
					tableHtml += `<tr data-month-row="${m}">`;

					// 季度单元格（每季度第一行）
					if (m % 3 === 0 && isFirstMonthRow && i === 0) {
						tableHtml += `<th class="sticky-col sticky-col-1" rowspan="${3 * 12}">第${quarter}季度</th>`;
					}

					// 月份单元格（每月第一行）
					if (isFirstMonthRow && i === 0) {
						tableHtml += `<th class="sticky-col sticky-col-2 month-header drill-down" 
                             rowspan="12" data-month="${m}">${monthNames[m]}</th>`;
					}

					// 修程类型单元格（每种修程第一行）
					if (i === 0) {
						tableHtml += `<th class="sticky-col sticky-col-3" 
                             rowspan="${rowCount}">${taskType}</th>`;
					}

					// 车辆数据单元格
					VEHICLES.forEach((vehicle) => {
						const monthKey = `${year}-${m}`;
						const task = annualData.schedule[monthKey]?.[vehicle]?.[taskType]?.[i] || '';
						const taskClass = task ? `highlight-task-${taskType}` : '';
						const highlightClass = highlightedTaskType === taskType ? `highlight-specific-${taskType}` : '';

						tableHtml += `
              <td 
                data-vehicle="${vehicle}" 
                data-month="${m}" 
                data-task-type="${taskType}" 
                data-task-index="${i}"
                class="${taskClass} ${highlightClass}"
              >
                ${task}
              </td>
            `;
					});

					// 汇总数据单元格（每月第一行）
					if (isFirstMonthRow && i === 0) {
						summaryHeaders.forEach((header) => {
							const value = annualData.monthlySummary[m]?.[header] || 0;
							tableHtml += `<td class="summary-col" rowspan="12">${value}</td>`;
						});
					}

					tableHtml += `</tr>`;
				}

				isFirstMonthRow = false;
			});
		}

		tableHtml += `</tbody></table>`;

		return <div dangerouslySetInnerHTML={{ __html: tableHtml }} />;
	};

	// 渲染月度视图表格
	const renderMonthlyTable = () => {
		if (!monthlyData.schedule) return null;

		// 计算日期范围：上个月26号到当月25号
		const currentMonthStart = new Date(year, month, 1);
		const prevMonthLastDay = new Date(year, month, 0).getDate();
		const prevMonthStartDate = 26; // 上个月开始日期
		const currentMonthEndDate = 25; // 当月结束日期

		// 计算日期数组和表头分组
		const dates = [];
		const headerGroups = [];

		// 上个月部分（26号到月底）
		if (month === 0) {
			// 1月的上个月是上一年的12月
			const prevYear = year - 1;
			for (let d = prevMonthStartDate; d <= prevMonthLastDay; d++) {
				dates.push({ year: prevYear, month: 11, date: d });
			}
			headerGroups.push({
				label: `${prevYear}年12月`,
				colspan: prevMonthLastDay - prevMonthStartDate + 1,
			});
		} else {
			// 其他月份的上个月
			const prevMonth = month - 1;
			for (let d = prevMonthStartDate; d <= prevMonthLastDay; d++) {
				dates.push({ year: year, month: prevMonth, date: d });
			}
			headerGroups.push({
				label: `${year}年${prevMonth + 1}月`,
				colspan: prevMonthLastDay - prevMonthStartDate + 1,
			});
		}

		// 当月部分（1号到25号）
		for (let d = 1; d <= currentMonthEndDate; d++) {
			dates.push({ year: year, month: month, date: d });
		}
		headerGroups.push({
			label: `${year}年${month + 1}月`,
			colspan: currentMonthEndDate,
		});

		// 表格头部
		let tableHtml = `
      <table class="view-monthly">
        <thead>
          <tr>
            <th rowspan="2">车号</th>`;

		// 添加分段的月份表头
		headerGroups.forEach((group) => {
			tableHtml += `<th colspan="${group.colspan}">${group.label}</th>`;
		});

		tableHtml += `${TASK_CATEGORIES.map((t) => `<th rowspan="2" class="summary-col">${t.charAt(0)}</th>`).join('')}
          </tr>
          <tr>
    `;

		// 日期表头
		dates.forEach((dateInfo) => {
			const dayOfWeek = new Date(dateInfo.year, dateInfo.month, dateInfo.date).getDay();
			const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
			tableHtml += `<th data-day-col="${dateInfo.date}" class="${isWeekend ? 'weekend' : ''}">${dateInfo.date}</th>`;
		});

		tableHtml += `</tr></thead><tbody>`;

		// 车辆数据行
		VEHICLES.forEach((vehicle) => {
			tableHtml += `<tr data-vehicle-row="${vehicle}">`;
			tableHtml += `<th>${vehicle}</th>`;

			// 每日任务单元格
			dates.forEach((dateInfo) => {
				const key = `${vehicle}-${dateInfo.date}`;
				const taskInfo = monthlyData.schedule[key];
				// 使用codes数组显示多个任务代码
				const taskCodes = taskInfo?.codes || (taskInfo?.code ? [taskInfo.code] : []);
				const displayCodes = taskCodes.join('/');
				const taskType = taskInfo?.def?.type || '';

				const dayOfWeek = new Date(dateInfo.year, dateInfo.month, dateInfo.date).getDay();
				const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
				const taskClass = displayCodes ? `highlight-task-${taskType}` : '';
				const highlightClass = highlightedTaskType === taskType ? `highlight-specific-${taskType}` : '';

				tableHtml += `
          <td 
            data-vehicle="${vehicle}" 
            data-day="${dateInfo.date}"
            class="task-cell ${isWeekend ? 'weekend' : ''} ${taskClass} ${highlightClass}"
            data-tooltip-text="${displayCodes}"
          >
            ${displayCodes}
          </td>
        `;
			});

			// 车辆汇总列
			TASK_CATEGORIES.forEach((taskType) => {
				const count = monthlyData.vehicleSummary[vehicle]?.[taskType] || 0;
				tableHtml += `<td class="summary-col">${count}</td>`;
			});

			tableHtml += `</tr>`;
		});

		tableHtml += `</tbody></table>`;

		return <div dangerouslySetInnerHTML={{ __html: tableHtml }} />;
	};

	// 移除嵌套的useEffect，将tooltip处理逻辑放在顶层useEffect中
	useEffect(() => {
		const tableContainer = document.getElementById('schedule-table-container');
		const tooltip = tooltipRef.current;

		// 显示Tooltip
		const showTooltip = (e) => {
			const cell = e.target.closest('.task-cell');
			if (!cell || !tooltip) return;

			const tooltipText = cell.getAttribute('data-tooltip-text');
			if (!tooltipText) return;

			// 设置Tooltip内容
			tooltip.textContent = tooltipText;

			// 重置tooltip状态
			tooltip.classList.remove('bottom');

			// 使用相对于视口的绝对定位
			const rect = cell.getBoundingClientRect();

			// 显示在单元格下方，稍微偏右一点，避免被鼠标遮挡
			let left = rect.left + rect.width / 3;
			let top = rect.bottom + 5;

			// 检查是否会超出视口右侧
			if (left + 200 > window.innerWidth) {
				left = window.innerWidth - 200;
			}

			// 检查是否会超出视口顶部
			if (top < 10) {
				top = 10;
			}

			// 设置位置
			tooltip.style.left = `${left}px`;
			tooltip.style.top = `${top}px`;

			// 直接显示tooltip
			tooltip.style.visibility = 'visible';
			tooltip.style.opacity = '1';
		};

		// 隐藏Tooltip
		const hideTooltip = () => {
			if (tooltip) {
				tooltip.style.visibility = 'hidden';
				tooltip.style.opacity = '0';
			}
		};

		// 事件监听 - 简化的方式
		if (tableContainer && tooltip) {
			// 给所有.task-cell添加事件监听
			const addCellEventListeners = () => {
				const cells = tableContainer.querySelectorAll('.task-cell');
				cells.forEach((cell) => {
					cell.addEventListener('mouseenter', showTooltip);
					cell.addEventListener('mouseleave', hideTooltip);
				});
			};

			// 初始添加事件监听
			addCellEventListeners();

			// 监听表格内容变化，重新添加事件监听
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.addedNodes.length > 0) {
						addCellEventListeners();
					}
				});
			});

			observer.observe(tableContainer, {
				childList: true,
				subtree: true,
			});

			// 清理函数
			return () => {
				observer.disconnect();
				const cells = tableContainer.querySelectorAll('.task-cell');
				cells.forEach((cell) => {
					cell.removeEventListener('mouseenter', showTooltip);
					cell.removeEventListener('mouseleave', hideTooltip);
				});
				if (tooltipTimeoutRef.current) {
					clearTimeout(tooltipTimeoutRef.current);
				}
			};
		}
	}, []);

	// 设置单元格点击事件监听
	useEffect(() => {
		const tableContainer = document.getElementById('schedule-table-container');

		const handleClick = (e) => {
			const cell = e.target.closest('td');
			if (!cell) return;

			// 高亮处理
			document.querySelectorAll('.highlight-row, .highlight-column, .highlight-cell').forEach((el) => el.classList.remove('highlight-row', 'highlight-column', 'highlight-cell'));

			// 添加高亮类
			cell.classList.add('highlight-cell');
			cell.parentElement.classList.add('highlight-row');

			// 找到列中的所有单元格并高亮
			const cells = Array.from(tableContainer.querySelectorAll('tr')).map((row) => row.cells[Array.from(cell.parentElement.cells).indexOf(cell)]);
			cells.forEach((c) => c && c.classList.add('highlight-column'));

			// 提取单元格数据并触发回调
			if (viewType === 'monthly') {
				const vehicle = cell.dataset.vehicle;
				const day = cell.dataset.day;
				if (vehicle && day) {
					onCellClick({ vehicle, day }, e);
				}
			} else {
				const vehicle = cell.dataset.vehicle;
				const month = cell.dataset.month;
				const taskType = cell.dataset.taskType;
				const taskIndex = cell.dataset.taskIndex;

				if (vehicle && month !== undefined && taskType && taskIndex !== undefined) {
					onCellClick({ vehicle, month: parseInt(month), taskType, taskIndex: parseInt(taskIndex) }, e);
				}
			}
		};

		tableContainer.addEventListener('click', handleClick);
		return () => tableContainer.removeEventListener('click', handleClick);
	}, [viewType, onCellClick]);

	return (
		<div id='schedule-table-container'>
			{viewType === 'annual' ? renderAnnualTable() : renderMonthlyTable()}
			<div
				ref={tooltipRef}
				className='custom-tooltip'
			></div>
		</div>
	);
};

export default ScheduleTable;
