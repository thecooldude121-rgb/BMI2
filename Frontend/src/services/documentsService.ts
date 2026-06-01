import { supabase } from '../lib/supabase';

export interface Document {
  id: string;
  document_id: string;
  name: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  category: string;
  description?: string;
  uploaded_by: string;
  owner_name: string;
  is_starred?: boolean;
  starred?: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_name?: string;
  activity_id?: string;
  created_at: string;
  updated_at: string;
  modified_at?: string;
  last_accessed_at?: string;
  version: number;
  access_count: number;
  folder_id?: string;
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  owner?: string;
  category?: string;
  search?: string;
  starred?: boolean;
  entity_type?: string;
  entity_id?: string;
}

export interface DocumentShareRequest {
  user_ids: string[];
  permission?: 'view' | 'edit' | 'download';
}

export interface UploadDocumentRequest {
  name: string;
  file: File;
  category: string;
  description?: string;
  owner_name: string;
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_name?: string;
  activity_id?: string;
  tags?: string[];
}

export const documentsService = {
  async loadDocuments(filters: DocumentFilters = {}) {
    const {
      page = 1,
      limit = 25,
      owner,
      category,
      search,
      starred,
      entity_type,
      entity_id,
    } = filters;

    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (owner) {
      query = query.eq('owner_name', owner);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (starred) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favorites } = await supabase
          .from('document_favorites')
          .select('document_id')
          .eq('user_id', user.id);

        if (favorites && favorites.length > 0) {
          const docIds = favorites.map(f => f.document_id);
          query = query.in('id', docIds);
        } else {
          return { data: [], count: 0 };
        }
      }
    }

    if (entity_type && entity_id) {
      query = query
        .eq('related_entity_type', entity_type)
        .eq('related_entity_id', entity_id);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data: data || [], count: count || 0 };
  },

  async uploadDocument(request: UploadDocumentRequest, onProgress?: (progress: number) => void) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    onProgress?.(10);

    const fileExt = request.file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `documents/${user.id}/${fileName}`;

    onProgress?.(30);

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, request.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    onProgress?.(60);

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    onProgress?.(80);

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const { data, error } = await supabase
      .from('documents')
      .insert({
        document_id: documentId,
        name: request.name,
        file_type: fileExt || 'unknown',
        file_size: request.file.size,
        file_url: urlData.publicUrl,
        category: request.category,
        description: request.description,
        uploaded_by: user.id,
        owner_name: request.owner_name,
        related_entity_type: request.related_entity_type,
        related_entity_id: request.related_entity_id,
        related_entity_name: request.related_entity_name,
        activity_id: request.activity_id,
        version: 1,
        access_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (request.tags && request.tags.length > 0) {
      await this.addTags(data.id, request.tags);
    }

    await this.logActivity(data.id, user.id, 'uploaded');

    onProgress?.(100);

    return data;
  },

  async deleteDocuments(documentIds: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: documents } = await supabase
      .from('documents')
      .select('id, file_url, uploaded_by')
      .in('id', documentIds);

    if (!documents) {
      throw new Error('Documents not found');
    }

    const ownedDocs = documents.filter(doc => doc.uploaded_by === user.id);
    if (ownedDocs.length !== documentIds.length) {
      throw new Error('You can only delete your own documents');
    }

    const { error } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', documentIds);

    if (error) {
      throw new Error(error.message);
    }

    for (const doc of ownedDocs) {
      await this.logActivity(doc.id, user.id, 'deleted');
    }

    return { success: true, deleted: documentIds.length };
  },

  async shareDocument(documentId: string, request: DocumentShareRequest) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: document } = await supabase
      .from('documents')
      .select('uploaded_by')
      .eq('id', documentId)
      .single();

    if (!document || document.uploaded_by !== user.id) {
      throw new Error('You can only share your own documents');
    }

    const shares = request.user_ids.map(userId => ({
      document_id: documentId,
      shared_with_user_id: userId,
      shared_by: user.id,
      permission: request.permission || 'view',
    }));

    const { error } = await supabase
      .from('document_shares')
      .insert(shares);

    if (error) {
      throw new Error(error.message);
    }

    await this.logActivity(documentId, user.id, 'shared', {
      shared_with: request.user_ids,
    });

    return { success: true, shared_with: request.user_ids.length };
  },

  async downloadDocument(documentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!document) {
      throw new Error('Document not found');
    }

    await supabase
      .from('documents')
      .update({
        access_count: (document.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    await this.logActivity(documentId, user.id, 'downloaded');

    return document.file_url;
  },

  async toggleFavorite(documentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: existing } = await supabase
      .from('document_favorites')
      .select('id')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('document_favorites')
        .delete()
        .eq('id', existing.id);

      if (error) throw new Error(error.message);
      return { is_starred: false };
    } else {
      const { error } = await supabase
        .from('document_favorites')
        .insert({
          document_id: documentId,
          user_id: user.id,
        });

      if (error) throw new Error(error.message);
      return { is_starred: true };
    }
  },

  async getUserFavorites() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set<string>();

    const { data } = await supabase
      .from('document_favorites')
      .select('document_id')
      .eq('user_id', user.id);

    return new Set(data?.map(f => f.document_id) || []);
  },

  async searchDocuments(query: string, category?: string) {
    let searchQuery = supabase
      .from('documents')
      .select('*')
      .is('deleted_at', null)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (category) {
      searchQuery = searchQuery.eq('category', category);
    }

    const { data, error } = await searchQuery;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async getDocumentById(documentId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await this.logActivity(documentId, user.id, 'viewed');
    }

    return data;
  },

  async updateDocument(documentId: string, updates: Partial<Document>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('uploaded_by', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await this.logActivity(documentId, user.id, 'edited');

    return data;
  },

  async addTags(documentId: string, tags: string[]) {
    for (const tagName of tags) {
      let { data: tag } = await supabase
        .from('document_tags')
        .select('id')
        .eq('name', tagName)
        .single();

      if (!tag) {
        const { data: newTag } = await supabase
          .from('document_tags')
          .insert({ name: tagName })
          .select()
          .single();
        tag = newTag;
      }

      if (tag) {
        await supabase
          .from('document_tag_assignments')
          .insert({
            document_id: documentId,
            tag_id: tag.id,
          });
      }
    }
  },

  async logActivity(documentId: string, userId: string, action: string, metadata: any = {}) {
    await supabase
      .from('document_activity_log')
      .insert({
        document_id: documentId,
        user_id: userId,
        action,
        metadata,
      });
  },
};
