import { Icon, IconButton, InlineField, InlineFieldRow, InlineLabel, Stack, useStyles2 } from '@grafana/ui';
import { getSharedStyles, noRightMargin } from './sharedStyles';
import React from 'react';
import { CascaderSegment } from './CascaderSegment';
import { QueryPrompts } from 'dictionary';
import { DropdownSegment, DropdownSegmentOption } from './DropdownSegment';
import { cx } from '@emotion/css';
import { ListOption } from './types';
import { ZSTarget } from 'types';
import { getDefaultTarget } from 'services/utils';

type OrderBy = ZSTarget['orderBy'];

interface Props {
  onChange: (event: ZSTarget['orderBy']) => void;
  value: OrderBy;
  options: ListOption[];
}

export function OrderByFieldRow({ value: orderBy, onChange, options }: Props) {
  const styles = useStyles2(getSharedStyles);

  function handleColumnChange(event: string) {
    const column= { name: event, value: event, alias: '' };
    const payload: OrderBy = {
      ...orderBy,
      column,
      colName: column.alias || column.name
    };

    onChange(payload);
  }

  function handleDirectionChange(event: DropdownSegmentOption<OrderBy['sort']>) {
    onChange({ ...orderBy, sort: event.value! });
  }

  const columnIsEmpty = orderBy.colName === QueryPrompts.orderBy;

  return (
    <InlineFieldRow>
      <InlineField label="ORDER BY" labelWidth={12} className={styles.inlineField}>
        <CascaderSegment
          selected={orderBy.colName || QueryPrompts.orderBy}
          onSelect={handleColumnChange}
          options={options}
        ></CascaderSegment>
      </InlineField>
      {!columnIsEmpty && (
        <InlineField>
          <Stack gap={0.25} direction="row">
            <DropdownSegment<OrderBy['sort']>
              placement="auto"
              selected={orderBy.sort || QueryPrompts.orderBy}
              onSelect={handleDirectionChange}
              options={[
                { label: 'ASC', value: 'ASC' },
                { label: 'DESC', value: 'DESC' },
              ]}
            >
              <InlineLabel className={cx(styles.inlineLabel, noRightMargin)} as="span">
                {orderBy.sort}
                <Icon name={orderBy.sort === 'DESC' ? 'sort-amount-down' : 'sort-amount-up'} />
              </InlineLabel>
            </DropdownSegment>
          </Stack>
        </InlineField>
      )}
      {!columnIsEmpty && (
        <div className="gf-form-label">
          <IconButton
            className={noRightMargin}
            name="times"
            size="lg"
            onClick={() => onChange(getDefaultTarget().orderBy)}
            tooltip="Clear OrderBy"
            tooltipPlacement="top"
          />
        </div>
      )}
      <InlineField grow={true} className={styles.inlineField}>
        <InlineLabel className={noRightMargin}>
          <></>
        </InlineLabel>
      </InlineField>
    </InlineFieldRow>
  );
}
