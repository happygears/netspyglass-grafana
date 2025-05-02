import { Icon, InlineField, InlineFieldRow, InlineLabel, Tooltip, useStyles2 } from '@grafana/ui';
import { QueryHints, QueryPrompts } from 'dictionary';
import React from 'react';
import { getSharedStyles } from './sharedStyles';
import { CascaderSegment } from './CascaderSegment';
import { ListOptionTree } from './types';

interface Props extends React.PropsWithChildren {
  onChange: (event: string) => void;
  options: Array<ListOptionTree | 'divider'>;
  value: string;
}

export function FromFieldRow({ children, options, value, onChange }: Props) {
  const styles = useStyles2(getSharedStyles);
  const cascaderOptions = options
    .filter((t) => t !== 'divider')
    .map((option) => ({ ...option, selelectable: false, value: option.label, items: option.items }));

  return (
    <InlineFieldRow>
      <InlineField labelWidth={12} label="FROM" className={styles.inlineField} tooltip={QueryHints.variable}>
        <CascaderSegment
          selected={value || QueryPrompts.variable}
          options={cascaderOptions}
          onSelect={(event) => onChange(event)}
        />
      </InlineField>
      <InlineField grow={true} className={styles.inlineField}>
        <InlineLabel>
          <Tooltip content={QueryHints.variable} placement="top-start">
            <Icon name="question-circle" />
          </Tooltip>
        </InlineLabel>
      </InlineField>
      {children}
    </InlineFieldRow>
  );
}
