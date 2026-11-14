export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'owner' | 'worker';
export type ExperienceVerificationType = 'self_declared' | 'store_confirmed';
export type ShiftPostStatus =
  | 'Draft'
  | 'Open'
  | 'Reviewing'
  | 'Pending'
  | 'Matched'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Expired'
  | 'Disputed';
export type ApplicationStatus = 'submitted' | 'accepted' | 'rejected' | 'cancelled';
export type InvitationStatus = 'Pending' | 'Matched' | 'Cancelled' | 'Expired';
export type MatchStatus = 'Matched' | 'In Progress' | 'Completed' | 'Cancelled' | 'Disputed';
export type MatchType = 'post_application' | 'direct_invitation';
export type AttendanceStatus = 'scheduled' | 'clocked_in' | 'clocked_out' | 'no_show' | 'disputed';
export type PaymentStatus = 'pending' | 'paid' | 'disputed';
export type ReportStatus = 'submitted' | 'investigating' | 'resolved' | 'dismissed';

// 하위 호환 별칭
export type JobStatus = ShiftPostStatus;
export type DirectRequestStatus = InvitationStatus;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Relationships: [];
        Row: {
          id: string;
          role: UserRole;
          name: string;
          phone: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          name: string;
          phone: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          name?: string;
          phone?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brands: {
        Relationships: [];
        Row: {
          id: string;
          name: string;
          category: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      stores: {
        Relationships: [];
        Row: {
          id: string;
          owner_id: string;
          brand_id: string;
          branch_name: string;
          address_summary: string;
          address_detail: string;
          contact_phone: string;
          min_shift_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          brand_id: string;
          branch_name: string;
          address_summary: string;
          address_detail: string;
          contact_phone: string;
          min_shift_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          brand_id?: string;
          branch_name?: string;
          address_summary?: string;
          address_detail?: string;
          contact_phone?: string;
          min_shift_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      work_experiences: {
        Relationships: [];
        Row: {
          id: string;
          worker_id: string;
          brand_id: string;
          branch_name?: string | null;
          months_of_exp: number;
          start_date?: string | null;
          end_date?: string | null;
          roles?: string[] | null;
          skills?: string[] | null;
          verification_type: ExperienceVerificationType;
          confirmed_by_store_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          brand_id: string;
          branch_name?: string | null;
          months_of_exp?: number;
          start_date?: string | null;
          end_date?: string | null;
          roles?: string[] | null;
          skills?: string[] | null;
          verification_type?: ExperienceVerificationType;
          confirmed_by_store_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          brand_id?: string;
          branch_name?: string | null;
          months_of_exp?: number;
          start_date?: string | null;
          end_date?: string | null;
          roles?: string[] | null;
          skills?: string[] | null;
          verification_type?: ExperienceVerificationType;
          confirmed_by_store_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      worker_availability: {
        Relationships: [];
        Row: {
          id: string;
          worker_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_available?: boolean;
          created_at?: string;
        };
      };
      shift_posts: {
        Relationships: [];
        Row: {
          id: string;
          store_id: string;
          title: string;
          work_date: string;
          start_time: string;
          end_time: string;
          hourly_wage: number;
          description: string | null;
          status: ShiftPostStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          title: string;
          work_date: string;
          start_time: string;
          end_time: string;
          hourly_wage: number;
          description?: string | null;
          status?: ShiftPostStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          title?: string;
          work_date?: string;
          start_time?: string;
          end_time?: string;
          hourly_wage?: number;
          description?: string | null;
          status?: ShiftPostStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      applications: {
        Relationships: [];
        Row: {
          id: string;
          post_id: string;
          worker_id: string;
          status: ApplicationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          worker_id: string;
          status?: ApplicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          worker_id?: string;
          status?: ApplicationStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      shift_invitations: {
        Relationships: [];
        Row: {
          id: string;
          store_id: string;
          worker_id: string;
          post_id: string | null;
          work_date: string;
          start_time: string;
          end_time: string;
          hourly_wage: number;
          message: string | null;
          rejection_reason: string | null;
          status: InvitationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          worker_id: string;
          post_id?: string | null;
          work_date: string;
          start_time: string;
          end_time: string;
          hourly_wage: number;
          message?: string | null;
          rejection_reason?: string | null;
          status?: InvitationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          worker_id?: string;
          post_id?: string | null;
          work_date?: string;
          start_time?: string;
          end_time?: string;
          hourly_wage?: number;
          message?: string | null;
          rejection_reason?: string | null;
          status?: InvitationStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Relationships: [];
        Row: {
          id: string;
          match_type: MatchType;
          post_id: string | null;
          invitation_id: string | null;
          store_id: string;
          worker_id: string;
          start_time: string;
          end_time: string;
          hourly_wage: number;
          status: MatchStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_type: MatchType;
          post_id?: string | null;
          invitation_id?: string | null;
          store_id: string;
          worker_id: string;
          start_time: string;
          end_time: string;
          hourly_wage: number;
          status?: MatchStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_type?: MatchType;
          post_id?: string | null;
          invitation_id?: string | null;
          store_id?: string;
          worker_id?: string;
          start_time?: string;
          end_time?: string;
          hourly_wage?: number;
          status?: MatchStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Relationships: [];
        Row: {
          id: string;
          match_id: string;
          check_in_time: string | null;
          check_out_time: string | null;
          actual_hours: number | null;
          status: AttendanceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          check_in_time?: string | null;
          check_out_time?: string | null;
          actual_hours?: number | null;
          status?: AttendanceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          check_in_time?: string | null;
          check_out_time?: string | null;
          actual_hours?: number | null;
          status?: AttendanceStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Relationships: [];
        Row: {
          id: string;
          match_id: string;
          total_amount: number;
          payment_status: PaymentStatus;
          paid_at: string | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          total_amount: number;
          payment_status?: PaymentStatus;
          paid_at?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          total_amount?: number;
          payment_status?: PaymentStatus;
          paid_at?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          link_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          link_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          link_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      reviews: {
        Relationships: [];
        Row: {
          id: string;
          match_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      reports: {
        Relationships: [];
        Row: {
          id: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason_category: string;
          details: string | null;
          status: ReportStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason_category: string;
          details?: string | null;
          status?: ReportStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: string;
          target_id?: string;
          reason_category?: string;
          details?: string | null;
          status?: ReportStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      status_history: {
        Relationships: [];
        Row: {
          id: number;
          entity_type: string;
          entity_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          entity_type: string;
          entity_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          entity_type?: string;
          entity_id?: string;
          from_status?: string | null;
          to_status?: string;
          changed_by?: string | null;
          reason?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      rpc_accept_shift_application: {
        Args: {
          p_post_id: string;
          p_worker_id: string;
        };
        Returns: string;
      };
      rpc_accept_shift_invitation: {
        Args: {
          p_invitation_id: string;
        };
        Returns: string;
      };
    };
  };
}
