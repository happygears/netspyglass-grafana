import {
  Icon,
  IconButton,
  InlineField,
  InlineLabel,
  InlineSegmentGroup,
  Segment,
  SegmentAsync,
  SegmentSection,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import { groupByTimeTags, QueryHints, QueryPrompts } from 'dictionary';
import { getSharedStyles, noRightMargin } from './sharedStyles';
import { SelectableValue } from '@grafana/data';
import React from 'react';
import { CascaderSegment } from './CascaderSegment';
import { ListOptionTree } from './types';
import { getDefaultTarget } from 'services/utils';
import { ZSTarget } from 'types';

interface Props {
  onChange: (event: ZSTarget['groupBy']) => void;
  options: ListOptionTree[];
  value: ZSTarget['groupBy'];
}

export function GroupByFieldRow({ value: groupBy, onChange, options }: Props) {
  const styles = useStyles2(getSharedStyles);
  const isValueEmpty = groupBy.type === QueryPrompts.groupByType && groupBy.value === QueryPrompts.groupBy;

  return (
    <SegmentSection label="GROUP BY" fill={false}>
      <InlineSegmentGroup>
        <Segment<string>
          options={[
            { label: 'Time', value: 'time' },
            { label: 'Column', value: 'column' },
          ]}
          value={groupBy.type}
          onChange={(event) => onChange({ type: event.value!, value: QueryPrompts.groupBy })}
        ></Segment>
        {groupBy.type === 'time' && (
          <SegmentAsync<string>
            value={groupBy.value}
            onChange={(event) => onChange({ ...groupBy, value: event.value! })}
            loadOptions={function (query?: string): Promise<Array<SelectableValue<string>>> {
              return Promise.resolve(groupByTimeTags);
            }}
          ></SegmentAsync>
        )}
        {groupBy.type === 'column' && (
          <CascaderSegment
            options={options}
            selected={groupBy.value}
            onSelect={(event) => onChange({ ...groupBy, value: event! })}
          ></CascaderSegment>
        )}
      </InlineSegmentGroup>
      {!isValueEmpty && (
        <div className="gf-form-label">
          <IconButton
            className={noRightMargin}
            name="times"
            size="lg"
            onClick={() => onChange(getDefaultTarget().groupBy)}
            tooltip="Clear GroupBy"
            tooltipPlacement="top"
          />
        </div>
      )}
      <InlineField className={styles.inlineField} grow={true}>
        <InlineLabel className={noRightMargin}>
          <Tooltip content={QueryHints.groupBy} placement="top-start">
            <Icon name="question-circle" />
          </Tooltip>
        </InlineLabel>
      </InlineField>
    </SegmentSection>
  );
}
