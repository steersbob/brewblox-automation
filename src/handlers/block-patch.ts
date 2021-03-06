import axios from 'axios';

import { eventbus } from '../eventbus';
import { BlockPatchImpl } from '../types';
import { ActionHandler } from './types';

const stripPostFix = (key: string) => key.replace(/[\[<].+/, '');

/**
 * Merge existing block data with the given change set.
 */
const handler: ActionHandler<BlockPatchImpl> = {

  async prepare(opts) {
    void opts;
  },

  async apply({ impl, title }) {
    if (impl.serviceId == null || impl.blockId == null) {
      return;
    }

    const block = eventbus.getBlocks(impl.serviceId)
      .find(v => v.id === impl.blockId);

    if (!block) {
      throw new Error(`Block ${impl.serviceId}::${impl.blockId} not found when applying ${title}`);
    }

    // Filter keys with the same root but a different postfix
    // We want 'key[min]' in impl.data to override 'key[s]' in block data
    const updatedKeys = Object.keys(impl.data).map(k => stripPostFix(k));
    const unchangedData = {};
    Object.entries(block.data)
      .filter(([k]) => !updatedKeys.includes(stripPostFix(k)))
      .forEach(([k, v]) => unchangedData[k] = v);

    await axios.post(`http://${impl.serviceId}:5000/${impl.serviceId}/blocks/write`, {
      ...block,
      data: {
        ...unchangedData,
        ...impl.data,
      },
    });
  },
};

export default handler;
