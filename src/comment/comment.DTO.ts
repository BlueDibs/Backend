import { createZodDto } from 'nestjs-zod'
import { z } from 'nestjs-zod/z'

const commentSchema = z.object({
    content: z.string()
})

export class AddCommentDTO extends createZodDto(commentSchema) { }