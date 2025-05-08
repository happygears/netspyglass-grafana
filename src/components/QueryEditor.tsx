import React, { useId } from 'react';

import type { EditorProps } from './VisualQueryEditor/types';
import { VisualQueryEditor } from './VisualQueryEditor/VisualQueryEditor';
import { getDefaultTarget } from 'services/utils';
import { RawQueryEditor } from './VisualQueryEditor/RawQueryEditor';

export function QueryEditor(props: EditorProps) {
  const rootId = useId();
  const target = props.query._nsgTarget || getDefaultTarget({ limit: 100 });
  const rawEditor = !!target.rawQuery;
  const visualEditor = !rawEditor;

  return (
    <div id={rootId}>
      {visualEditor && <VisualQueryEditor {...props} />}
      {rawEditor && <RawQueryEditor {...props} />}
    </div>
  );
}
