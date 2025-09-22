import React, { useContext, useState } from 'react';
import { ScheduleContext } from '../../../context/ScheduleContext';
// 导入antd组件
import { Modal, Input, Progress, message } from 'antd';
// 导入模拟数据生成函数
import { generateAnnualData, generateMonthlyData } from '../../../mock/modules/schedule';
import './index.css';

// 月份选项
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
	label: `${i + 1}月`,
	value: i,
}));

const TopToolbar = ({}) => {
	// 修复：将所有Context解构统一放在函数开头
	const { 
		currentYear, 
		currentMonth, 
		currentView, 
		setCurrentView, 
		setCurrentMonth, 
		importData, 
		exportData, 
		setCurrentYear, 
		setAnnualData, 
		setMonthlyData,
		transformAnnualData,
		transformMonthlyData,
		setHighlightedTaskType // 移到这里
	} = useContext(ScheduleContext);

	// 预排功能相关状态
	const [schedulingModalVisible, setSchedulingModalVisible] = useState(false);
	const [schedulingType, setSchedulingType] = useState('annual'); // 'annual' 或 'monthly'
	const [schedulingYear, setSchedulingYear] = useState(currentYear);
	const [schedulingMonth, setSchedulingMonth] = useState(currentMonth !== null ? currentMonth : new Date().getMonth());
	const [schedulingProgress, setSchedulingProgress] = useState(0);
	const [isGenerating, setIsGenerating] = useState(false);

	// 返回年度视图/清空月份，并清除高亮
	const handleBackToAnnual = () => {
		setCurrentView('annual');
		setCurrentMonth(null);
		setHighlightedTaskType(null); // 清除任务高亮
	};

	// 移除中间的重复解构代码
	// 由于在当前代码片段中缺少setHighlightedTaskType的定义，这里需要添加
	// const { setHighlightedTaskType } = useContext(ScheduleContext);

	// 其余代码保持不变
	// 预排年计划
	const preScheduleAnnual = () => {
		setSchedulingType('annual');
		setSchedulingYear(currentYear);
		setSchedulingModalVisible(true);
	};

	// 预排月计划
	const preScheduleMonthly = () => {
		if (currentView !== 'monthly') {
			message.warning('请先进入月度视图再执行月度预排。');
			return;
		}
		setSchedulingType('monthly');
		setSchedulingYear(currentYear);
		setSchedulingMonth(currentMonth !== null ? currentMonth : new Date().getMonth());
		setSchedulingModalVisible(true);
	};

	// 处理预排确认
	const handleSchedulingConfirm = () => {
		// 添加标志变量，确保回调只执行一次
		let isCallbackExecuted = false;
		
		setIsGenerating(true);
		setSchedulingProgress(0);
	
		// 模拟进度更新
		const interval = setInterval(() => {
			setSchedulingProgress((prev) => {
				const newProgress = prev + 5;
				if (newProgress >= 100 && !isCallbackExecuted) {
					// 标记回调已执行
					isCallbackExecuted = true;
					clearInterval(interval);
	
					// 生成数据
					setTimeout(() => {
						if (schedulingType === 'annual') {
							// 生成年度数据
							const annualMockData = generateAnnualData(schedulingYear);
							setAnnualData(transformAnnualData(annualMockData));
							setCurrentYear(schedulingYear);
							setCurrentView('annual');
							message.success(`已成功生成 ${schedulingYear} 年的预排计划`);
						} else {
							// 生成月度数据
							// 如果年份变化了，先更新年度数据
							if (schedulingYear !== currentYear) {
								const annualMockData = generateAnnualData(schedulingYear);
								setAnnualData(transformAnnualData(annualMockData));
								setCurrentYear(schedulingYear);
							}
	
							const monthlyMockData = generateMonthlyData(schedulingYear, schedulingMonth);
							setMonthlyData(transformMonthlyData(monthlyMockData));
							setCurrentMonth(schedulingMonth);
							message.success(`已成功生成 ${schedulingYear}年${schedulingMonth + 1}月 的预排计划`);
						}
	
						setIsGenerating(false);
						setSchedulingModalVisible(false);
					}, 500);
					return 100;
				}
				return newProgress;
			});
		}, 100);
	};

	return (
		<div id='top-toolbar'>
			<div className='toolbar-buttons'>
				<button
					id='import-data-btn'
					onClick={importData}
				>
					导入数据
				</button>
				<button
					id='export-data-btn'
					onClick={exportData}
				>
					导出数据
				</button>
			</div>

			<h1 id='main-title'>
				<button
					id='back-to-annual-btn'
					style={{ display: currentView === 'monthly' ? 'flex' : 'none' }}
					onClick={handleBackToAnnual}
				>
					‹
				</button>
				<span id='title-text'>{currentView === 'annual' ? `${currentYear}年度检修计划` : `${currentYear}年 ${currentMonth + 1}月 检修计划`}</span>
			</h1>

			<div className='toolbar-buttons'>
				<button
					id='pre-schedule-annual-btn'
					onClick={preScheduleAnnual}
				>
					预排年计划
				</button>
				<button
					id='pre-schedule-monthly-btn'
					onClick={preScheduleMonthly}
				>
					预排月计划
				</button>
			</div>
			<Modal
				title={schedulingType === 'annual' ? '预排年计划' : '预排月计划'}
				open={schedulingModalVisible}
				onOk={handleSchedulingConfirm}
				onCancel={() => setSchedulingModalVisible(false)}
				okText='确认'
				cancelText='取消'
				width={400}
				okButtonProps={{ disabled: isGenerating }}
				cancelButtonProps={{ disabled: isGenerating }}
			>
				{isGenerating ? (
					<div style={{ textAlign: 'center', padding: '20px 0' }}>
						<Progress
							percent={schedulingProgress}
							percentPosition={{ align: 'end', type: 'inner' }}
              size={[300,20]}
							status='active'
						/>
						<p style={{ marginTop: '10px' }}>{schedulingType === 'annual' ? `正在生成${schedulingYear}年计划...` : `正在生成${schedulingYear}年${schedulingMonth + 1}月计划...`}</p>
					</div>
				) : (
					<div className='modal-content-container'>
						<p style={{ marginBottom: '10px' }}>{schedulingType === 'annual' ? '选择年份：' : '选择年月：'}</p>
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
							<Input
								type='number'
								value={schedulingYear}
								onChange={(e) => setSchedulingYear(parseInt(e.target.value) || currentYear)}
								style={{ width: '100px' }}
								min={2000}
								max={2100}
							/>
							{schedulingType === 'monthly' && (
								<>
									<span>年</span>
									<select
										value={schedulingMonth}
										onChange={(e) => setSchedulingMonth(parseInt(e.target.value))}
										style={{ padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
									>
										{MONTH_OPTIONS.map((month) => (
											<option
												key={month.value}
												value={month.value}
											>
												{month.label}
											</option>
										))}
									</select>
								</>
							)}
							{schedulingType === 'annual' && <span>年</span>}
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
};

export default TopToolbar;
