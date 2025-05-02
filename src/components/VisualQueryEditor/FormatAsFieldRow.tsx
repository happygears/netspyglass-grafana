import { SegmentSection, InlineField, Select } from '@grafana/ui';
import React from 'react';

interface Props {
  onChange: (value: string) => void;
  value: string;
}
export function FormatAsFieldRow({ value, onChange }: Props) {
  return (
    <SegmentSection label="FORMAT AS" fill={true}>
      <InlineField>
        <Select
          options={[
            { label: 'Time Series', value: 'time_series' },
            { label: 'Table', value: 'table' },
          ]}
          value={value}
          onChange={(event) => onChange(event.value!)}
        ></Select>
      </InlineField>
    </SegmentSection>
  );
}
