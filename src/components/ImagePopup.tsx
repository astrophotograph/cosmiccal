import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
// Import a markdown library (you'll need to install this)
import ReactMarkdown from 'react-markdown'

type PopupProps = {
  imageUrl: string | undefined;
  date: string | undefined;
  text?: string | undefined;
  onClose: () => void;
  isOpen: boolean;
};

const ImagePopup = ({imageUrl, date, text, isOpen, onClose}: PopupProps) => {
  if (!imageUrl || !date) return null

  console.log({ imageUrl, date, text, isOpen})

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-auto bg-gray-800"
        showCloseButton={true}
      >
        <DialogTitle className="text-xl text-white font-semibold">{date}</DialogTitle>
        <div className="flex flex-col space-y-4">
          <img
            src={imageUrl}
            alt={`Image for ${date}`}
            className="max-w-full max-h-[50vh] object-contain mx-auto"
          />

          {text && (
            <div className="prose prose-invert prose-sm max-w-none px-4 py-3 bg-gray-700 rounded-md">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImagePopup
