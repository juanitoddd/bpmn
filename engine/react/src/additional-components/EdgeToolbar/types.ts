import type { HTMLAttributes, ReactNode } from 'react';
import type { EdgeToolbarBaseProps } from '@bpflow/system';

/**
 * @inline
 */
export type EdgeToolbarProps = EdgeToolbarBaseProps &
  HTMLAttributes<HTMLDivElement> & {
    /**
     * An edge toolbar must be attached to an edge.
     */
    edgeId: string;
    children?: ReactNode;
  };
