import React, { useContext, useState } from 'react';
import { ScheduleContext } from '../../../context/ScheduleContext';
import InfoPanel from '../../common/InfoPanel';
import './index.css';

const ControlsPanel = ({ currentView, setCurrentView }) => {
	const { currentYear, currentMonth, setCurrentYear, setCurrentMonth, annualData, setHighlightedTaskType,setIsClickCanvasCard } = useContext(ScheduleContext);

	const [showYearSelector, setShowYearSelector] = useState(false);

	// 切换年份
	const changeYear = (direction) => {
		setIsClickCanvasCard(false);
		setCurrentYear((prev) => prev + direction);
	};

	// 切换到指定月份 - 实现完整的navigateTo功能
	const goToMonth = (monthIndex) => {
		setCurrentMonth(monthIndex);
		setCurrentView('monthly'); // 切换到月度视图
		clearTaskHighlights(); // 清除任务高亮
	};

	// 清除任务高亮
	const clearTaskHighlights = () => {
		setHighlightedTaskType(null);
	};

	// 生成年份选择器
	const renderYearSelector = () => {
		const years = [];
		const startYear = currentYear - 5;
		const endYear = currentYear + 5;

		for (let year = startYear; year <= endYear; year++) {
			years.push(
				<li
					key={year}
					className={year === currentYear ? 'current' : ''}
					onClick={() => {
						setCurrentYear(year);
						setShowYearSelector(false);
					}}
				>
					{year}年
				</li>
			);
		}

		return (
			<div
				className='modal'
				style={{ display: showYearSelector ? 'flex' : 'none' }}
			>
				<div className='modal-content'>
					<h3>选择年份</h3>
					<ul id='year-selector-list'>{years}</ul>
					<div className='modal-actions'>
						<button onClick={() => setShowYearSelector(false)}>关闭</button>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div id='controls-panel'>
			<div id='left-panel-container'>
				<div id='panel-header'>
					<button
						id='prev-btn'
						className='arrow-btn'
						onClick={() => changeYear(-1)}
					>
						‹
					</button>
					<button
						id='change-year-btn'
						onClick={() => {
							setShowYearSelector(true);
							setIsClickCanvasCard(false);
						}}
					>
						{currentYear}年
					</button>
					<button
						id='next-btn'
						className='arrow-btn'
						onClick={() => changeYear(1)}
					>
						›
					</button>
				</div>

				<div id='calendar-grid'>
					{Array.from({ length: 12 }).map((_, index) => (
						<div
							key={index}
							className={`month-cell ${index === currentMonth ? 'current-month' : ''}`}
							data-month-index={index}
							onClick={() => goToMonth(index)}
						>
							{index + 1}月
						</div>
					))}
				</div>
			</div>

			<InfoPanel />
			{renderYearSelector()}
		</div>
	);
};

export default ControlsPanel;
