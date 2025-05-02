import React, { useEffect, useState } from 'react';
import { Button, ConfirmModal } from '@grafana/ui';

type Props = {
  rawMode: boolean;
  onChange: (value: boolean) => void;
};

export const QueryEditorModeSwitcher = ({ rawMode, onChange }: Props) => {
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setModalOpen(false);
  }, [rawMode]);

  if (rawMode) {
    return (
      <>
        <Button
          aria-label="Switch to visual editor"
          icon="pen"
          variant="secondary"
          type="button"
          onClick={() => setModalOpen(true)}
        ></Button>
        <ConfirmModal
          isOpen={isModalOpen}
          title="Switch to visual editor mode"
          body="Are your sure to switch to visual editor? Your changes will be lost."
          confirmText="Confirm"
          dismissText="Cancel"
          onConfirm={() => onChange(false)}
          onDismiss={() => setModalOpen(false)}
        />
      </>
    );
  } else {
    return (
      <Button
        aria-label="Switch to text editor"
        icon="pen"
        variant="secondary"
        type="button"
        onClick={() => onChange(true)}
      ></Button>
    );
  }
};
