import { useContext, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ScheduleContext } from '../../../context/ScheduleContext';

const LoadChart = ({ viewType, year, month, annualData, monthlyData }) => {
	const chartRef = useRef(null);
	const chartInstance = useRef(null);
	const { TASK_CATEGORIES } = useContext(ScheduleContext);

	// 初始化图表
	useEffect(() => {
		if (chartRef.current && !chartInstance.current) {
			chartInstance.current = echarts.init(chartRef.current);
		}

		// 更新图表数据
		updateChartData();

		// 响应窗口大小变化
		const handleResize = () => {
			chartInstance.current?.resize();
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [viewType, year, month, annualData, monthlyData]);

	// 更新图表数据
	const updateChartData = () => {
		if (!chartInstance.current) return;

		let option;

		if (viewType === 'annual' && annualData.monthlyManHours) {
			// 年度视图图表配置
			option = {
				title: {
					text: '年度每月总工时负载',
					textStyle: { fontSize: 14, color: '#1a237e' },
					left: 'left',
					top: 0,
				},
				tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
				legend: {
					data: TASK_CATEGORIES,
					top: 10,
					left: 'center',
				},
				grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
				xAxis: {
					type: 'category',
					data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
				},
				yAxis: { type: 'value', name: '总工时 (h)' },
				series: TASK_CATEGORIES.map((type, index) => ({
					name: type,
					type: 'bar',
					stack: 'total',
					emphasis: { focus: 'series' },
					itemStyle: {
						color: index === 0 ? '#7986cb' : index === 1 ? '#4db6ac' : '#ffb74d',
					},
					data: Array.from({ length: 12 }, (_, m) => annualData.monthlyManHours[m]?.[type] || 0),
				})),
			};
		} else if (viewType === 'monthly' && monthlyData.dailyManHours) {
			// 月度视图图表配置
			const daysInMonth = Object.keys(monthlyData.dailyManHours).length;

			option = {
				title: {
					text: '月度每日总工时负载',
					textStyle: { fontSize: 14, color: '#1a237e' },
					left: 'left',
					top: 0,
				},
				tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
				legend: {
					data: TASK_CATEGORIES,
					top: 10,
					left: 'center',
				},
				grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
				xAxis: {
					type: 'category',
					data: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`),
				},
				yAxis: { type: 'value', name: '总工时 (h)' },
				series: TASK_CATEGORIES.map((type, index) => ({
					name: type,
					type: 'bar',
					stack: 'total',
					emphasis: { focus: 'series' },
					itemStyle: {
						color: index === 0 ? '#7986cb' : index === 1 ? '#4db6ac' : '#ffb74d',
					},
					data: Array.from({ length: daysInMonth }, (_, i) => {
						const day = i + 1;
						return monthlyData.dailyManHours[day]?.[type] || 0;
					}),
				})),
			};
		}

		if (option) {
			chartInstance.current.setOption(option, true);
		}
	};

	return (
		<div
			id='load-chart'
			ref={chartRef}
			style={{ width: '100%', height: '100%', flexGrow: 1 }}
		/>
	);
};

export default LoadChart;
