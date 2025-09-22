import { useContext, useRef, useEffect, useState } from 'react';
// 导入ScheduleContext和样式
import { ScheduleContext } from '../../../context/ScheduleContext';
import './index.css';
// 导入模拟数据生成函数
import { generateAnnualData, generateMonthlyData } from '../../../mock/modules/schedule';

const LLMChatPanel = ({ collapsed, onToggle }) => {
	const { 
		chatMessages, 
		setChatMessages, 
		sendChatMessage, 
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
		transformMonthlyData
	} = useContext(ScheduleContext);
	const inputRef = useRef(null);
	const messagesEndRef = useRef(null);
	const [isThinking, setIsThinking] = useState(false);
	const [thinkingStep, setThinkingStep] = useState('');
	const [schedulingContext, setSchedulingContext] = useState(null);

	// 自动滚动到底部
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatMessages, thinkingStep]);

	// 面板切换时聚焦输入框并处理图表重绘
	useEffect(() => {
		if (!collapsed) {
			inputRef.current?.focus();
			// 延迟执行图表重绘，确保面板已完全展开
			setTimeout(() => {
				// 触发全局resize事件，让图表组件能响应布局变化
				window.dispatchEvent(new Event('resize'));
			}, 350);
		}
	}, [collapsed]);

	// 处理消息发送
	const handleSubmit = (e) => {
		e.preventDefault();
		if (inputRef.current && inputRef.current.value.trim()) {
			handleSendMessage(inputRef.current.value.trim());
			inputRef.current.value = '';
		}
	};

	// 完整的消息发送处理逻辑
	const handleSendMessage = (messageText) => {
		setIsThinking(true);
		setThinkingStep('');

		// 添加用户消息
		sendChatMessage(messageText);

		// 提取命令参数并模拟思考过程
		const params = extractCommandParams(messageText);
		simulateThinkingProcess(messageText, params);
	};

	// 从消息文本中提取命令参数
	const extractCommandParams = (messageText) => {
		const params = { types: [] };
		const text = messageText;
		const lowerCaseText = text.toLowerCase();

		// 提取年份和月份
		const yearMatch = text.match(/(\d{4})年/);
		const monthMatch = text.match(/(\d{1,2})月/);
		params.year = yearMatch ? parseInt(yearMatch[1], 10) : currentYear;
		params.month = monthMatch ? parseInt(monthMatch[1], 10) - 1 : -1;

		// 提取任务类型
		const taskTypes = [];
		if (text.includes('均衡修')) taskTypes.push('均衡修');
		if (text.includes('特别修')) taskTypes.push('特别修');
		if (text.includes('专项修')) taskTypes.push('专项修');
		params.types = taskTypes.length > 0 ? taskTypes : ['均衡修', '特别修', '专项修'];

		// 确定操作类型
		if (text.includes('预排') || text.includes('先排') || text.includes('只排')) {
			params.action = params.month > -1 ? '预排月计划' : '预排年计划';
		} else if (text.includes('导入数据')) {
			params.action = '导入数据';
		} else {
			params.action = 'other';
		}

		return params;
	};

	// 模拟多步骤思考过程并生成可视化结果
	const simulateThinkingProcess = async (messageText, params) => {
		// 根据消息类型确定思考步骤
		const thinkingSteps = {
			预排年计划: [`收到指令：预排 ${params.year} 年计划 (${params.types.join('、')})。`, '分析需求：需要为所有车辆生成全年的任务...', '正在根据历史数据和维修规则进行计算...', '任务分配完成，正在生成可视化看板...'],
			预排月计划: [`收到指令：预排 ${params.year}年 ${params.month + 1}月 计划 (${params.types.join('、')})。`, '分析需求：需要为指定月份分配具体任务日期...', '正在进行任务分解与工时计算...', '月度计划生成完毕...'],
			导入数据: ['收到数据导入指令。', '正在解析文件格式格式...', '校验数据完整性与准确性...', '数据已准备就绪，可加载至视图...'],
			highlight: ['识别高亮任务类型...', '分析相关数据...', '生成专项分析报告...'],
			help: ['准备帮助指南...'],
			other: ['正在理解您的问题...', '检索相关信息...'],
		};

		// 确定使用哪个思考步骤
		let stepsKey = 'other';
		if (params.action && thinkingSteps[params.action]) {
			stepsKey = params.action;
		} else if (messageText.includes('高亮')) {
			stepsKey = 'highlight';
		} else if (messageText.includes('帮助') || messageText === '?' || messageText === '？') {
			stepsKey = 'help';
		}

		const steps = thinkingSteps[stepsKey];

		// 逐步显示思考步骤
		for (const step of steps) {
			await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
			setThinkingStep(step);
		}

		// 思考完成，等待最终响应
		await new Promise((resolve) => setTimeout(resolve, 800));
		setIsThinking(false);
		setThinkingStep('');

		// 对于预排计划和导入数据，生成可视化卡片并添加到聊天记录
		if (params.action === '预排年计划' || params.action === '预排月计划' || params.action === '导入数据') {
			const canvasId = `canvas-${Date.now()}`;
			const canvasTitle = params.action === '导入数据' ? '导入的数据' : `${params.year}年${params.month > -1 ? params.month + 1 + '月' : ''}计划`;
			const canvasDetails = params.action === '导入数据' ? '点击应用数据到当前视图' : `点击将此计划应用到主界面`;

			const canvasHTML = `
		      <div class="canvas-card" id="${canvasId}"
		           data-action="apply-plan"
		           data-year="${params.year}"
		           data-month="${params.month}"
		           data-types="${params.types.join(',')}"
		      >
		        <div class="canvas-header">
		          <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#3f51b5"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
		          <span>${canvasTitle} (${params.types.join('、')})</span>
		        </div>
		        <div class="canvas-details">${canvasDetails}</div>
		      </div>
		    `;

			// 添加模型消息
			setChatMessages((prev) => [...prev, { type: 'model', content: canvasHTML }]);
		}
	};

	// 文件上传处理
	const handleFileUpload = () => {
		const fileInput = document.getElementById('file-input');
		if (fileInput) {
			fileInput.click();
		}
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			handleSendMessage(`已上传文件: ${file.name}`);
			// 重置文件输入，以便可以再次选择同一文件
			e.target.value = '';
		}
	};

	// 显示帮助信息
	const showHelp = () => {
		handleSendMessage('帮助');
	};

	// 处理消息区域的点击事件（特别是canvas卡片）
	const handleMessageClick = (e) => {
		const canvasCard = e.target.closest('.canvas-card');
		if (canvasCard && !canvasCard.classList.contains('applied')) {
			// 添加应用动画效果
			const appContainer = document.getElementById('app-container');
			if (appContainer) {
				appContainer.classList.add('applying-canvas-animation');
				setTimeout(() => {
					appContainer.classList.remove('applying-canvas-animation');
				}, 1000);
			}

			// 标记为已应用
			canvasCard.classList.add('applied');
			const headerEl = canvasCard.querySelector('.canvas-header');
			if (headerEl) {
				headerEl.innerHTML += ' (已应用)';
			}

			// 从data属性获取信息
			const { action, year, month, types } = canvasCard.dataset;
			const newYear = parseInt(year, 10);
			const newMonth = parseInt(month, 10);
			const scheduledTypes = types ? types.split(',') : ['均衡修', '特别修', '专项修'];

			// 延迟执行实际应用逻辑
			setTimeout(() => {
				if (action === 'apply-plan') {
					// 设置年份和视图
					setCurrentYear(newYear);

					// 直接调用模拟数据生成函数
					if (newMonth > -1) {
						setCurrentMonth(newMonth);
						setCurrentView('monthly');
						// 生成月度模拟数据
						const monthlyMockData = generateMonthlyData(newYear, newMonth, scheduledTypes);
						// 转换数据格式并更新状态
						if (transformMonthlyData && monthlyMockData) {
							setMonthlyData(transformMonthlyData(monthlyMockData));
						}
					} else {
						setCurrentView('annual');
						// 生成年度模拟数据
						const annualMockData = generateAnnualData(newYear, scheduledTypes);
						// 转换数据格式并更新状态
						if (transformAnnualData && annualMockData) {
							setAnnualData(transformAnnualData(annualMockData));
						}
					}

					// 检查剩余任务类型
					const allTaskTypes = ['均衡修', '特别修', '专项修'];
					const remainingTypes = allTaskTypes.filter((t) => !scheduledTypes.includes(t));

					// 设置调度上下文
					setSchedulingContext(remainingTypes.length > 0 ? { year: newYear, month: newMonth, scheduledTypes: scheduledTypes } : null);

					// 添加提示消息
					if (remainingTypes.length > 0) {
						addMessageToChat(`好的，${scheduledTypes.join('、')}已排程完毕。接下来需要排什么修程？（剩余：${remainingTypes.join('、')}）`, 'model');
					} else {
						addMessageToChat(`好的，${newYear}年${newMonth > -1 ? newMonth + 1 + '月' : ''}的所有计划已在主界面上显示。`, 'model');
					}
				}
			}, 500); // 延迟执行，让动画先播放一部分
		}
	};

	// 辅助函数：向聊天记录添加消息
	const addMessageToChat = (content, type = 'model') => {
		setChatMessages((prev) => [...prev, { type, content }]);
	};

	// 渲染思考指示器
	const renderThinkingIndicator = () => {
		if (!isThinking) return null;

		return (
			<div className='chat-message model'>
				{thinkingStep ? (
					<div>{thinkingStep}</div>
				) : (
					<div className='thinking-indicator'>
						<div className='dot'></div>
						<div className='dot'></div>
						<div className='dot'></div>
					</div>
				)}
			</div>
		);
	};

	return (
		<>
			<div
				id='llm-chat-panel'
				className={collapsed ? 'collapsed' : ''}
			>
				<div id='chat-header'>
					<span>计划排程智能体</span>
					<button
						id='chat-help-btn'
						onClick={showHelp}
						title='查看样例指令'
					>
						?
					</button>
				</div>

				<div
					id='chat-messages'
					onClick={handleMessageClick}
				>
					{chatMessages.map((msg, index) => (
						<div
							key={index}
							className={`chat-message ${msg.type}`}
							dangerouslySetInnerHTML={{ __html: msg.content }}
						/>
					))}
					{renderThinkingIndicator()}
					<div ref={messagesEndRef} />
				</div>

				<div id='chat-input-container'>
					<form
						id='chat-input-form'
						onSubmit={handleSubmit}
					>
						<button
							type='button'
							id='chat-upload-btn'
							onClick={handleFileUpload}
							title='上传文件'
							disabled={isThinking}
						>
							📎
						</button>
						<input
							type='file'
							id='file-input'
							onChange={handleFileChange}
							style={{ display: 'none' }}
						/>
						<input
							type='text'
							id='chat-input'
							ref={inputRef}
							placeholder={isThinking ? 'AI正在思考...' : '输入消息...'}
							autoComplete='off'
							disabled={isThinking}
						/>
						<button
							type='submit'
							id='chat-send-btn'
							title='发送'
							disabled={isThinking}
						>
							➤
						</button>
					</form>
				</div>
			</div>

			{/* 聊天面板切换标签 - 必须放在聊天面板外部，作为相邻兄弟元素 */}
			<div
				id='chat-toggle-tab'
				onClick={onToggle}
				title={collapsed ? '打开智能体' : '关闭智能体'}
			>
				排程智能体
			</div>
		</>
	);
};

export default LLMChatPanel;
