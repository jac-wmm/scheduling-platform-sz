import React, { useContext, useState, useEffect } from 'react';
import { ScheduleContext } from '../../../context/ScheduleContext';
import ScheduleTable from '../../schedule/ScheduleTable';
import LoadChart from '../../schedule/LoadChart';
import CellEditor from '../../common/CellEditor';
import './index.css';

const ContentPanel = ({ currentView }) => {
	const { currentYear, currentMonth, annualData, monthlyData, updateMonthlySchedule, updateAnnualSchedule, TASK_DEFS } = useContext(ScheduleContext);

	const [editorVisible, setEditorVisible] = useState(false);
	const [editorPosition, setEditorPosition] = useState({ x: 0, y: 0 });
	const [currentCell, setCurrentCell] = useState(null);

	// 监听视图变化，关闭单元格编辑器
	useEffect(() => {
		setEditorVisible(false);
	}, [currentView]);

	// 处理单元格点击
	const handleCellClick = (cellData, event) => {
		const rect = event.target.getBoundingClientRect();
		const containerRect = document.getElementById('content-panel').getBoundingClientRect();

		setCurrentCell(cellData);
		setEditorPosition({
			x: rect.left - containerRect.left,
			y: rect.top - containerRect.top + 25,
		});
		setEditorVisible(true);
	};

	// 确认任务选择
	const confirmTaskSelection = (taskCode) => {
		if (!currentCell) return;

		if (currentView === 'monthly') {
			updateMonthlySchedule(currentCell.vehicle, currentCell.day, taskCode);
		} else {
			updateAnnualSchedule(currentCell.vehicle, currentCell.month, currentCell.taskType, currentCell.taskIndex, taskCode);
		}

		setEditorVisible(false);
	};

	return (
		<div id='content-panel'>
			<div id='schedule-table-container'>
				<ScheduleTable
					viewType={currentView}
					year={currentYear}
					month={currentMonth}
					annualData={annualData}
					monthlyData={monthlyData}
					onCellClick={handleCellClick}
				/>
			</div>

			<div id='load-chart-container'>
				<LoadChart
					viewType={currentView}
					year={currentYear}
					month={currentMonth}
					annualData={annualData}
					monthlyData={monthlyData}
				/>
			</div>

			<CellEditor
				visible={editorVisible}
				position={editorPosition}
				onClose={() => setEditorVisible(false)}
				onConfirm={confirmTaskSelection}
				currentCell={currentCell}
				taskDefinitions={TASK_DEFS}
			/>
		</div>
	);
};

export default ContentPanel;
