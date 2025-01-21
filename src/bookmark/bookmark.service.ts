import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prismaService: PrismaService) {}
  getBookmarks(userId: number) {
    return this.prismaService.bookmark.findMany({
      where: {
        userId,
      },
    });
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prismaService.bookmark.findUnique({
      where: {
        id: bookmarkId,
        userId,
      },
    });

    if (!bookmark || bookmark.userId !== userId) {
      throw new ForbiddenException('Bookmark not found');
    }
    return bookmark;
  }

  createBookmark(userId: number, dto: CreateBookmarkDto) {
    return this.prismaService.bookmark.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        ...dto,
      },
    });
  }

  editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
    return this.prismaService.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    });
  }

  deleteBookmarkById(userId: number, bookmarkId: number) {
    return this.prismaService.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}
