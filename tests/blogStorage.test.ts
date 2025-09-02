import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window and localStorage with capture of 'storage' handler
let storageHandler: any;
const addEventListenerMock = vi.fn((type: string, handler: any) => {
  if (type === 'storage') storageHandler = handler;
});
const removeEventListenerMock = vi.fn();

vi.stubGlobal('window', {
  localStorage: localStorageMock,
  addEventListener: addEventListenerMock,
  removeEventListener: removeEventListenerMock,
  dispatchEvent: vi.fn(),
});

import {
  getRawBlogIndex,
  setRawBlogIndex,
  getBlogIndex,
  saveBlogIndex,
  upsertPost,
  removePost,
  exportBlogIndex,
  importBlogIndex,
  subscribeBlogIndex,
  slugify,
} from "@/lib/dashboard/blogStorage";

describe("Blog Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  afterEach(() => {
    localStorageMock.clear.mockClear();
  });

  describe("slugify", () => {
    it("converts title to slug", () => {
      expect(slugify("Hello World!")).toBe("hello-world");
      expect(slugify("Test 123")).toBe("test-123");
      expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
      expect(slugify("Special@#$%Chars")).toBe("specialchars");
    });
  });

  describe("getRawBlogIndex / setRawBlogIndex", () => {
    it("stores and retrieves raw data", () => {
      const data = { posts: [{ title: "Test" }] };
      setRawBlogIndex(data);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('pp:blog:draft:raw', JSON.stringify(data));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(data));
      expect(getRawBlogIndex()).toEqual(data);
    });

    it("returns null when no data", () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(getRawBlogIndex()).toBeNull();
    });

    it("returns null on invalid JSON", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");
      expect(getRawBlogIndex()).toBeNull();
    });
  });

  describe("getBlogIndex", () => {
    it("returns parsed valid data", () => {
      const data = { posts: [{ slug: "test", title: "Test", content: "Content", status: "draft" }] };
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'pp:blog:draft:raw') return JSON.stringify(data);
        return null;
      });
      expect(getBlogIndex()).toEqual(data);
    });

    it("falls back to last valid on invalid raw", () => {
      const validData = { posts: [{ slug: "valid", title: "Valid", content: "Content", status: "draft" }] };
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'pp:blog:draft:raw') return "invalid";
        if (key === 'pp:blog:draft:lastValid') return JSON.stringify(validData);
        return null;
      });
      expect(getBlogIndex()).toEqual(validData);
    });
  });

  describe("saveBlogIndex", () => {
    it("saves valid data and updates last valid", () => {
      const data = { posts: [{ slug: "test", title: "Test", content: "Content", status: "draft" }] };
      const result = saveBlogIndex(data);
      expect(result.valid).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('pp:blog:draft:raw', JSON.stringify(data));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('pp:blog:draft:lastValid', JSON.stringify(data));
    });

    it("saves invalid data but returns errors", () => {
      const data = { posts: [{ invalidField: "test" }] };
      const result = saveBlogIndex(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe("upsertPost", () => {
    it("adds new post", () => {
      const post = { slug: "new-post", title: "New Post", content: "Content", status: "draft" };
      const result = upsertPost(post);
      expect(result.valid).toBe(true);
      expect(result.index!.posts).toHaveLength(1);
      expect(result.index!.posts[0]).toEqual(post);
    });

    it("updates existing post", () => {
      const existing = { slug: "test", title: "Old", content: "Old", status: "draft" };
      const updated = { slug: "test", title: "New", content: "New", status: "published" };

      // Set up existing data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'pp:blog:draft:raw') return JSON.stringify({ posts: [existing] });
        return null;
      });

      const result = upsertPost(updated);
      expect(result.valid).toBe(true);
      expect(result.index!.posts).toHaveLength(1);
      expect(result.index!.posts[0]).toEqual(updated);
    });

    it("returns errors for invalid post", () => {
      const invalidPost = { title: "Missing slug" };
      const result = upsertPost(invalidPost);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("removePost", () => {
    it("removes post by slug", () => {
      const posts = [
        { slug: "keep", title: "Keep", content: "Content", status: "draft" },
        { slug: "remove", title: "Remove", content: "Content", status: "draft" },
      ];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'pp:blog:draft:raw') return JSON.stringify({ posts });
        return null;
      });

      const result = removePost("remove");
      expect(result.valid).toBe(true);
      expect(result.index!.posts).toHaveLength(1);
      expect(result.index!.posts[0].slug).toBe("keep");
    });
  });

  describe("exportBlogIndex", () => {
    it("exports valid data as JSON", () => {
      const data = { posts: [{ slug: "test", title: "Test", content: "Content", status: "draft" }] };
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'pp:blog:draft:lastValid') return JSON.stringify(data);
        return null;
      });

      const exported = exportBlogIndex();
      expect(JSON.parse(exported)).toEqual(data);
    });
  });

  describe("importBlogIndex", () => {
    it("imports valid JSON", () => {
      const data = { posts: [{ slug: "test", title: "Test", content: "Content", status: "draft" }] };
      const json = JSON.stringify(data);
      const result = importBlogIndex(json);
      expect(result.valid).toBe(true);
    });

    it("returns errors for invalid JSON", () => {
      const result = importBlogIndex("invalid json");
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("subscribeBlogIndex", () => {
    it("subscribes to storage changes and invokes callback", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeBlogIndex(callback);

      // Simulate storage event by invoking captured handler
      storageHandler({ key: 'pp:blog:draft:raw', newValue: JSON.stringify({ posts: [] }) } as any);

      expect(callback).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
});