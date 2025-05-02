import { Dropdown, InlineLabel, Menu, useStyles2 } from '@grafana/ui';
import React, { ComponentProps, useMemo } from 'react';
import { getSharedStyles } from './sharedStyles';

export interface DropdownSegmentProps<T> extends React.PropsWithChildren {
  onSelect: (event: DropdownSegmentOption<T>) => void;
  options: Array<DropdownSegmentOption<T> | 'divider'>;
  selected: T;
  placement?: ComponentProps<typeof Dropdown>['placement'];
  onLabelClick?: () => void;
}

export interface DropdownSegmentOption<T> {
  label: string;
  options?: Array<DropdownSegmentOption<T> | 'divider'>;
  value?: T;
  interactive?: boolean;
}

export function DropdownSegment<T extends string>({
  options,
  selected,
  onSelect,
  children,
  placement,
  onLabelClick,
}: DropdownSegmentProps<T>) {
  const styles = useStyles2(getSharedStyles);
  const menuItems = useMemo(() => {
    return options.map((element) => ItemToJsx(element, selected, onSelect));
  }, [options, selected, onSelect]);

  const content = children || <InlineLabel className={styles.inlineLabel}>{selected}</InlineLabel>;

  return (
    <Dropdown overlay={<Menu>{menuItems}</Menu>} placement={placement || 'right-end'}>
      <div
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        onClickCapture={() => onLabelClick?.()}
      >
        {content}
      </div>
    </Dropdown>
  );
}

export function ItemToJsx<T>(
  option: DropdownSegmentOption<T> | 'divider',
  selected: T,
  onSelect: DropdownSegmentProps<T>['onSelect']
) {
  if (option === 'divider') {
    return <Menu.Divider />;
  }

  return (
    <Menu.Item
      label={option.label}
      key={option.label}
      active={option?.options?.some((item) => item !== 'divider' && selected === item.value)}
      childItems={option?.options?.map((el) => ItemToJsx(el, selected, onSelect))}
      onClick={() => {
        if (option.interactive || !option.options?.length) {
          onSelect(option);
        }
      }}
    />
  );
}
