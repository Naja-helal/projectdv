import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { categoryApi } from '@/lib/api'
import type { Category } from '@/types'

interface DeleteCategoryDialogProps {
  category: Category | null
  open: boolean
  onClose: () => void
}

export default function DeleteCategoryDialog({ category, open, onClose }: DeleteCategoryDialogProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (categoryId: number) => categoryApi.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
    onError: (error) => {
      console.error('خطأ في حذف الفئة:', error)
    }
  })

  const handleDelete = () => {
    if (category) {
      deleteMutation.mutate(category.id)
    }
  }

  if (!category) return null

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="w-full max-w-lg max-h-[95vh] overflow-y-auto m-0 sm:m-6 rounded-none sm:rounded-lg">
        <AlertDialogHeader className="text-center space-y-4 pb-6">
          <AlertDialogTitle className="text-2xl font-bold text-red-600">🗑️ حذف الفئة</AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-gray-700 leading-relaxed">
            هل أنت متأكد من حذف الفئة "<strong className="text-red-600">{category.name}</strong>"؟
            <br />
            <span className="text-red-500 font-semibold">⚠️ هذا الإجراء لا يمكن التراجع عنه.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-3 pt-6 border-t-2">
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full py-4 text-lg font-bold rounded-xl bg-red-600 hover:bg-red-700 min-h-[56px]"
          >
            {deleteMutation.isPending ? '⏳ جاري الحذف...' : '🗑️ تأكيد الحذف'}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full py-4 text-lg font-bold rounded-xl border-2 min-h-[56px]">
            ❌ إلغاء
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
