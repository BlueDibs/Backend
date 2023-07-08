import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const addUserSchema = z
  .object({
    firebaseId: z.string(),
    email: z.string(),
    username: z.string(),
  })
  .strict();

export const updateUserSchema = addUserSchema
  .partial()
  .omit({ firebaseId: true, email: true })
  .extend({
    bio: z.string().optional(),
    avatar: z.any().optional(),
    avatarPath: z.string().optional(),
  })
  .strict();

export const multipleProfileDTO = z.array(z.string());
const usrSetupSchema = z.object({
  shares_dilute: z.number(),
  equity_shares: z.number(),
});

export class UserSetupDTO extends createZodDto(usrSetupSchema) {}
export class AddUserDTO extends createZodDto(addUserSchema) {}
export class UpdateUserDTO extends createZodDto(updateUserSchema) {}
export class MultipleProfilesDTO extends createZodDto(multipleProfileDTO) {}
