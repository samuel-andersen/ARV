/**
 * Database types for the typed Supabase client.
 *
 * Hand-written to match supabase/migrations/*. Regenerate from a running local
 * database once Supabase is initialized:
 *   npm run db:types   (supabase gen types typescript --local)
 * Keep this in sync with the migrations until then.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Plan = "free" | "pro";
export type SourcePlatform = "youtube" | "instagram" | "tiktok" | "web" | "manual";
export type ImportStatus =
  | "pending" | "fetching" | "analyzing" | "review" | "done" | "failed";
export type BookStyle = "editorial" | "rustic" | "minimal";
export type BookStatus = "draft" | "ready" | "ordered";
export type ContributorRole = "owner" | "contributor";
export type OrderStatus =
  | "draft" | "quoted" | "submitted" | "in_production"
  | "shipped" | "delivered" | "failed";
export type PageTemplate =
  | "full_bleed_photo" | "photo_and_recipe" | "text_only_recipe"
  | "chapter_opener" | "dedication" | "toc";

type Row<T> = T;
type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

interface Profile {
  id: string;
  display_name: string | null;
  plan: Plan;
  created_at: string;
  updated_at: string;
}

interface Recipe {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  story: string | null;
  servings: number;
  prep_min: number | null;
  cook_min: number | null;
  image_url: string | null;
  source_platform: SourcePlatform;
  source_url: string | null;
  source_author: string | null;
  is_original: boolean;
  normalized: boolean;
  share_slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface IngredientRow {
  id: string;
  recipe_id: string;
  position: number;
  quantity: number | null;
  unit: string | null;
  name: string;
  note: string | null;
  needs_review: boolean;
}

interface StepRow {
  id: string;
  recipe_id: string;
  position: number;
  text: string;
  timer_seconds: number | null;
}

interface TagRow {
  id: string;
  name: string;
}

interface RecipeTagRow {
  recipe_id: string;
  tag_id: string;
}

interface ImportJobRow {
  id: string;
  user_id: string;
  source_url: string | null;
  status: ImportStatus;
  layers_used: string[];
  raw_caption: string | null;
  transcript: string | null;
  error: string | null;
  recipe_id: string | null;
  created_at: string;
}

interface BookRow {
  id: string;
  owner_id: string;
  title: string;
  subtitle: string | null;
  style: BookStyle;
  trim_size: string;
  status: BookStatus;
  cover_image: string | null;
  dedication: string | null;
  created_at: string;
  updated_at: string;
}

interface BookChapterRow {
  id: string;
  book_id: string;
  position: number;
  title: string;
  intro_text: string | null;
  intro_image: string | null;
}

interface BookRecipeRow {
  chapter_id: string;
  recipe_id: string;
  position: number;
  template_override: PageTemplate | null;
}

interface BookContributorRow {
  book_id: string;
  user_id: string | null;
  role: ContributorRole;
  invited_email: string | null;
  accepted_at: string | null;
}

interface BookExportRow {
  id: string;
  book_id: string;
  pdf_url: string;
  page_count: number;
  generated_at: string;
}

interface OrderRow {
  id: string;
  book_id: string;
  provider: string;
  status: OrderStatus;
  recipient_name: string | null;
  recipient_address: string | null;
  gift_note: string | null;
  created_at: string;
}

type Table<T> = { Row: Row<T>; Insert: Insert<T>; Update: Update<T>; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile>;
      recipes: Table<Recipe>;
      ingredients: Table<IngredientRow>;
      steps: Table<StepRow>;
      tags: Table<TagRow>;
      recipe_tags: Table<RecipeTagRow>;
      import_jobs: Table<ImportJobRow>;
      books: Table<BookRow>;
      book_chapters: Table<BookChapterRow>;
      book_recipes: Table<BookRecipeRow>;
      book_contributors: Table<BookContributorRow>;
      book_exports: Table<BookExportRow>;
      orders: Table<OrderRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_book_owner: { Args: { bid: string }; Returns: boolean };
      is_book_member: { Args: { bid: string }; Returns: boolean };
      owns_recipe: { Args: { rid: string }; Returns: boolean };
      can_read_recipe: { Args: { rid: string }; Returns: boolean };
    };
    Enums: {
      plan: Plan;
      source_platform: SourcePlatform;
      import_status: ImportStatus;
      book_style: BookStyle;
      book_status: BookStatus;
      contributor_role: ContributorRole;
      order_status: OrderStatus;
      page_template: PageTemplate;
    };
    CompositeTypes: Record<string, never>;
  };
}
