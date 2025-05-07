import { Cascader, CascaderOption, InlineLabel, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';
import { getSharedStyles, noRightMargin } from './sharedStyles';
import { css, cx, injectGlobal } from '@emotion/css';

const wrapperClassname = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// Fix gragana cascader element icon
injectGlobal(`
  .rc-cascader-dropdown .rc-cascader-menu-item-expand::after {
    mask: url(/public/img/icons/unicons/angle-right.svg) !important;
    background: currentcolor !important;
    width: 16px !important;
    height: 16px !important;
    top: 50% !important;
    right: 6px;
    transform: translateY(-50%) !important;
  }
`);

export interface CascaderSegmentProps<T> extends React.PropsWithChildren {
  onSelect: (event: string) => void;
  onLabelClick?: () => void;
  options: Array<CascaderOption & { selectable?: boolean }>;
  selected?: T;
  disabled?: boolean;
  loading?: boolean;
  allowCustomValue?: boolean;
}
export function CascaderSegment<T extends string>({
  children,
  selected,
  disabled,
  loading,
  options,
  allowCustomValue,
  onSelect,
  onLabelClick,
}: CascaderSegmentProps<T>) {
  const [showCascader, setShowCascader] = useState(false);
  const styles = useStyles2(getSharedStyles);

  function handleSelect(event: string) {
    function treeSearch(leaf: CascaderOption, target: string): CascaderOption | undefined {
      if ('items' in leaf && leaf.items?.length) {
        for (const item of leaf.items) {
          const result = treeSearch(item, target);

          if (result) {
            return result;
          }
        }
      } else if (leaf.value === target) {
        return leaf;
      }

      return;
    }

    if (treeSearch({ items: options, label: '_root', value: '_root' }, event)) {
      onSelect(event);
      setShowCascader(false);
      return;
    }

    if (allowCustomValue) {
      onSelect(event);
      setShowCascader(false);
    }
  }

  function handleLabelClick() {
    onLabelClick?.();
    setShowCascader(true);
  }

  function handleCascaderBlur() {
    setShowCascader(false);
  }

  return (
    <>
      {showCascader && (
        <>
          {loading && <LoadingPlaceholder text={''} style={{ margin: 0 }} />}
          <Cascader
            autoFocus={true}
            allowCustomValue={allowCustomValue}
            alwaysOpen={true}
            changeOnSelect={false}
            isClearable={false}
            hideActiveLevelLabel={false}
            displayAllSelectedLevels={false}
            onSelect={handleSelect}
            options={loading ? [{ label: 'Loading...', value: 'loading', disabled: true }] : options}
            initialValue={selected}
            onBlur={handleCascaderBlur}
            disabled={disabled}
          />
        </>
      )}
      {!showCascader && (
        <div className={wrapperClassname} onClick={handleLabelClick}>
          {children ?? <InlineLabel className={cx(styles.inlineLabel, noRightMargin)}>{selected}</InlineLabel>}
        </div>
      )}
    </>
  );
}
