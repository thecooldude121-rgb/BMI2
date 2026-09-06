import React from 'react';
import PipelineSettings from './PipelineSettings';

/**
 * Stage probabilities — folded into the real stage editor.
 *
 * This was a read-only table of five invented stages ("Qualification 10%,
 * Needs Analysis 25%…") over a `const` array, with a Save button beneath it.
 * The probabilities it displayed had never been this workspace's.
 *
 * Probability is one column of a stage, editable inline on the stage editor
 * alongside the name, type and colour — so there is nothing left for a separate
 * screen to do. See DealStages.tsx for why the nav entry is kept.
 */
const StageProbabilities: React.FC = () => <PipelineSettings />;

export default StageProbabilities;
