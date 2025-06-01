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
        className="max-w-4xl max-h-[90vh] overflow-auto bg-gray-800"
        showCloseButton={true}
      >
        <DialogTitle className="text-xl text-white font-semibold">{date}</DialogTitle>
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          {text && (
            <div className="prose prose-invert prose-sm max-w-none px-4 py-3 bg-gray-700 rounded-md md:flex-1">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}

          <img
            src={imageUrl}
            alt={`Image for ${date}`}
            className="max-w-full max-h-[50vh] object-contain mx-auto md:max-w-[45%]"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImagePopup
