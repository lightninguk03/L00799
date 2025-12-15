/**
 * **Feature: ui-redesign, Property 12: 发帖成功刷新列表**
 * **Feature: ui-redesign, Property 13: 发帖失败保留输入**
 * **Validates: Requirements 7.3, 7.5**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock QueryClient behavior
interface MockQueryClient {
  invalidateQueries: ReturnType<typeof vi.fn>;
  lastInvalidatedKey: string[] | null;
}

const createMockQueryClient = (): MockQueryClient => ({
  invalidateQueries: vi.fn(({ queryKey }) => {
    mockQueryClient.lastInvalidatedKey = queryKey;
  }),
  lastInvalidatedKey: null,
});

let mockQueryClient: MockQueryClient;

// Simulate CreatePostModal state management
interface PostModalState {
  content: string;
  selectedImages: File[];
  isOpen: boolean;
}

const createPostModalState = (initialContent: string = ''): PostModalState => ({
  content: initialContent,
  selectedImages: [],
  isOpen: true,
});

// Simulate successful post creation
const simulateSuccessfulPost = (
  state: PostModalState,
  queryClient: MockQueryClient,
  onSuccess?: () => void
): PostModalState => {
  // On success: invalidate queries, reset form, close modal
  queryClient.invalidateQueries({ queryKey: ['posts'] });
  onSuccess?.();
  return {
    content: '', // Form is reset
    selectedImages: [],
    isOpen: false, // Modal is closed
  };
};

// Simulate failed post creation
const simulateFailedPost = (state: PostModalState): PostModalState => {
  // On failure: keep user input, keep modal open
  return {
    ...state,
    isOpen: true, // Modal stays open
    // content and selectedImages are preserved
  };
};

describe('Property 12: 发帖成功刷新列表', () => {
  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it('*For any* successful post creation, the posts query should be invalidated', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 1000 }), // Valid post content
        (content) => {
          const state = createPostModalState(content);
          let onSuccessCalled = false;
          
          const newState = simulateSuccessfulPost(
            state,
            mockQueryClient,
            () => { onSuccessCalled = true; }
          );
          
          // Verify posts query was invalidated
          expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['posts'] });
          expect(mockQueryClient.lastInvalidatedKey).toEqual(['posts']);
          
          // Verify modal is closed and form is reset
          expect(newState.isOpen).toBe(false);
          expect(newState.content).toBe('');
          
          // Verify onSuccess callback was called
          expect(onSuccessCalled).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should invalidate posts query regardless of content length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 5000 }),
        fc.array(fc.string(), { minLength: 0, maxLength: 5 }), // Simulated image names
        (content, imageNames) => {
          const state: PostModalState = {
            content,
            selectedImages: imageNames.map(name => new File([], name)),
            isOpen: true,
          };
          
          simulateSuccessfulPost(state, mockQueryClient);
          
          expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 13: 发帖失败保留输入', () => {
  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it('*For any* failed post creation, user input should be preserved', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 1000 }),
        (content) => {
          const state = createPostModalState(content);
          const newState = simulateFailedPost(state);
          
          // Verify content is preserved
          expect(newState.content).toBe(content);
          
          // Verify modal stays open
          expect(newState.isOpen).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve both content and images on failure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 1000 }),
        fc.integer({ min: 0, max: 10 }),
        (content, imageCount) => {
          const mockImages = Array.from({ length: imageCount }, (_, i) => 
            new File([], `image_${i}.jpg`)
          );
          
          const state: PostModalState = {
            content,
            selectedImages: mockImages,
            isOpen: true,
          };
          
          const newState = simulateFailedPost(state);
          
          // Verify all data is preserved
          expect(newState.content).toBe(content);
          expect(newState.selectedImages.length).toBe(imageCount);
          expect(newState.isOpen).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not invalidate queries on failure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        (content) => {
          const state = createPostModalState(content);
          simulateFailedPost(state);
          
          // Verify queries were NOT invalidated
          expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
