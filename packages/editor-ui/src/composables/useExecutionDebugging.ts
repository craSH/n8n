import { useI18n, useMessage } from '@/composables';
import type { IExecutionResponse, IWorkflowDb } from '@/Interface';
import { MODAL_CONFIRM } from '@/constants';

export const useExecutionDebugging = () => {
	const i18n = useI18n();
	const message = useMessage();

	const pinExecutionData = async (
		workflow: IWorkflowDb,
		execution: IExecutionResponse | undefined,
	): Promise<IWorkflowDb> => {
		// If no execution data is available, return the workflow as is
		if (!execution?.data?.resultData) {
			return workflow;
		}

		const { runData, pinData } = execution.data.resultData;

		// Get nodes from execution data and apply their pinned data or the first execution data
		const executionNodesData = Object.entries(runData).map(([name, data]) => ({
			name,
			data: pinData?.[name] ?? data?.[0].data?.main[0],
		}));
		const workflowPinnedNodeNames = Object.keys(workflow.pinData ?? {});

		// Check if any of the workflow nodes have pinned data already
		if (executionNodesData.some((eNode) => workflowPinnedNodeNames.includes(eNode.name))) {
			const overWritePinnedDataConfirm = await message.confirm(
				i18n.baseText('nodeView.confirmMessage.debug.message'),
				i18n.baseText('nodeView.confirmMessage.debug.headline'),
				{
					type: 'warning',
					confirmButtonText: i18n.baseText('nodeView.confirmMessage.debug.confirmButtonText'),
					cancelButtonText: i18n.baseText('nodeView.confirmMessage.debug.cancelButtonText'),
					dangerouslyUseHTMLString: true,
				},
			);

			if (overWritePinnedDataConfirm !== MODAL_CONFIRM) {
				return workflow;
			}
		}

		// Overwrite the workflow pinned data with the execution data
		workflow.pinData = executionNodesData.reduce(
			(acc, { name, data }) => {
				// Only add data if it exists and the node is in the workflow
				if (acc && data && workflow.nodes.some((node) => node.name === name)) {
					acc[name] = data;
				}
				return acc;
			},
			{} as IWorkflowDb['pinData'],
		);

		return workflow;
	};

	return {
		pinExecutionData,
	};
};