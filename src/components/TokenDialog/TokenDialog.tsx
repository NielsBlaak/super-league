"use client";

import Dialog, { DialogBody } from "@/components/Dialog";
import TokenForm from "./TokenForm";

type TokenDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function TokenDialog({ open, onClose }: TokenDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Beheer">
      <DialogBody>
        <TokenForm />
      </DialogBody>
    </Dialog>
  );
}
