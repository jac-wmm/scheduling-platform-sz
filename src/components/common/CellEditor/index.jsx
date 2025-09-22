import { useEffect, useContext } from 'react';
import { ScheduleContext } from '../../../context/ScheduleContext';
import './index.css';

const CellEditor = ({ visible, position, onClose, onConfirm, currentCell, taskDefinitions }) => {
	const { currentYear, currentMonth } = useContext(ScheduleContext);
	const [selectedTask, setSelectedTask] = useState('');

	// 组件挂载时初始化选中的任务
	useEffect(() => {
		if (visible && currentCell) {
			// 在实际应用中，这里应该根据currentCell获取当前任务
			setSelectedTask('');
		}
	}, [visible, currentCell]);

	// 组织任务分类
	const getTasksByCategory = () => {
		const categories = { 均衡修: [], 特别修: [], 专项修: [] };

		Object.entries(taskDefinitions).forEach(([code, def]) => {
			if (categories[def.type]) {
				categories[def.type].push({ code, ...def });
			}
		});

		return categories;
	};

	const tasksByCategory = getTasksByCategory();

	if (!visible || !currentCell) return null;

	// 编辑器标题
	let title, subtitle;
	if (currentCell.day !== undefined) {
		title = `车号: ${currentCell.vehicle}`;
		subtitle = `${currentYear}年${currentMonth + 1}月${currentCell.day}日`;
	} else {
		title = `车号: ${currentCell.vehicle}`;
		subtitle = `${currentCell.month + 1}月, 修程: ${currentCell.taskType}`;
	}

	return (
		<div
			id='cell-editor'
			style={{
				display: 'flex',
				left: `${position.x}px`,
				top: `${position.y}px`,
			}}
		>
			<div className='editor-header'>
				<span id='editor-vehicle'>{title}</span>
				<span id='editor-context'>{subtitle}</span>
			</div>

			<div id='task-selector-content'>
				{Object.entries(tasksByCategory).map(([category, tasks]) => (
					<div key={category}>
						<div className='task-category-title'>{category}</div>
						<div>
							{tasks.map((task) => (
								<span
									key={task.code}
									className={`task-item ${selectedTask === task.code ? 'selected' : ''}`}
									onClick={() => setSelectedTask(task.code)}
								>
									{task.code}
								</span>
							))}
						</div>
					</div>
				))}

				<hr />
				<span
					className={`task-item ${selectedTask === '' ? 'selected' : ''}`}
					onClick={() => setSelectedTask('')}
				>
					清空
				</span>
			</div>

			<div className='editor-footer'>
				<div id='selected-task-info'>
					<span id='task-name'>{selectedTask ? `修程: ${taskDefinitions[selectedTask]?.type || ''}` : '修程: 无'}</span>
					<span id='task-manhours'>{selectedTask ? `工时: ${taskDefinitions[selectedTask]?.manHours || 0}h` : '工时: 0h'}</span>
				</div>

				<button
					id='editor-cancel'
					onClick={onClose}
				>
					取消
				</button>
				<button
					id='editor-confirm'
					onClick={() => onConfirm(selectedTask)}
				>
					确定
				</button>
			</div>
		</div>
	);
};

// 补充缺失的useState导入
import { useState } from 'react';

export default CellEditor;
