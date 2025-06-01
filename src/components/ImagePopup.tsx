import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

type PopupProps = {
  imageUrl: string | undefined;
  date: string | undefined;
  onClose: () => void;
  isOpen: boolean;
};

const ImagePopup = ({imageUrl, date, isOpen, onClose}: PopupProps) => {
  if (!imageUrl || !date) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-auto bg-gray-800"
        showCloseButton={true}
      >
        <DialogTitle className="text-xl text-white font-semibold">{date}</DialogTitle>
        <img
          src={imageUrl}
          alt={`Image for ${date}`}
          className="max-w-full max-h-[70vh] object-contain mx-auto"
        />
      </DialogContent>
    </Dialog>
  )
}

export default ImagePopup
