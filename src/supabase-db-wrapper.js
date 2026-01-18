/**
 * Supabase Database Wrapper - Firestore API Uyumluluğu
 * 
 * Bu wrapper, Firestore API'sine benzer bir interface sağlar.
 * Böylece mevcut kodları minimum değişiklikle Supabase'e geçirebiliriz.
 * 
 * Kullanım:
 *   const db = getSupabaseDB();
 *   db.collection('kullanicilar').doc(uid).get()
 *   db.collection('veriler').add(data)
 */

(function() {
  'use strict';

  // Supabase client'ı bekle (her zaman Promise döndürür)
  function getSupabase() {
    return new Promise((resolve) => {
      // Eğer zaten yüklüyse direkt döndür
      if (typeof window.supabase !== 'undefined' && 
          window.supabase && 
          typeof window.supabase.from === 'function') {
        resolve(window.supabase);
        return;
      }
      
      // Yoksa bekle
      let retries = 0;
      const maxRetries = 100;
      
      const checkInterval = setInterval(() => {
        retries++;
        
        if (typeof window.supabase !== 'undefined' && 
            window.supabase && 
            typeof window.supabase.from === 'function') {
          clearInterval(checkInterval);
          resolve(window.supabase);
        } else if (retries >= maxRetries) {
          clearInterval(checkInterval);
          console.error('❌ Supabase client yüklenemedi!');
          resolve(null);
        }
      }, 100);
    });
  }

  // Firestore benzeri Supabase Database wrapper
  class SupabaseDBWrapper {
    constructor() {
      this.supabase = null;
      this.initialized = false;
      this.init();
    }

    async init() {
      const supabase = await getSupabase();
      if (!supabase) {
        console.error('❌ Supabase client bulunamadı!');
        setTimeout(() => this.init(), 500);
        return;
      }

      this.supabase = supabase;
      this.initialized = true;
    }

    // Collection reference oluştur
    collection(collectionName) {
      // Eğer henüz initialize olmadıysa, geçici olarak null supabase ile oluştur
      // CollectionReference içinde ensureInitialized kontrolü var
      return new SupabaseCollectionReference(this.supabase, collectionName);
    }

    // Batch operations (Supabase'de yok, manuel yapılmalı)
    batch() {
      return new SupabaseBatch(this.supabase);
    }
  }

  // Collection Reference (Firestore API uyumlu)
  class SupabaseCollectionReference {
    constructor(supabase, collectionName) {
      this.supabase = supabase; // Bu null olabilir, ensureInitialized'da kontrol edilecek
      this.collectionName = collectionName;
    }

    // Document reference oluştur
    doc(docId) {
      return new SupabaseDocumentReference(this.supabase, this.collectionName, docId);
    }

    // Tüm dokümanları getir
    async get() {
      await this.ensureInitialized();
      
      try {
        const { data, error } = await this.supabase
          .from(this.collectionName)
          .select('*');

        if (error) {
          // Tablo yoksa boş döndür
          if (error.message && error.message.includes('does not exist')) {
            console.warn(`⚠️  Tablo "${this.collectionName}" Supabase'de yok`);
            return new SupabaseQuerySnapshot([]);
          }
          throw error;
        }

        // Firestore QuerySnapshot formatına dönüştür
        const docs = (data || []).map(item => ({
          id: item.id,
          data: () => item,
          exists: true
        }));

        return new SupabaseQuerySnapshot(docs);
      } catch (error) {
        console.error(`Collection get hatası (${this.collectionName}):`, error);
        return new SupabaseQuerySnapshot([]);
      }
    }

    // Query oluştur
    where(field, operator, value) {
      return new SupabaseQueryBuilder(this.supabase, this.collectionName)
        .where(field, operator, value);
    }

    // Limit
    limit(count) {
      return new SupabaseQueryBuilder(this.supabase, this.collectionName)
        .limit(count);
    }

    // Order by
    orderBy(field, direction = 'asc') {
      return new SupabaseQueryBuilder(this.supabase, this.collectionName)
        .orderBy(field, direction);
    }

    // Add document
    async add(data) {
      await this.ensureInitialized();
      
      try {
        const { data: inserted, error } = await this.supabase
          .from(this.collectionName)
          .insert(data)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return {
          id: inserted.id,
          get: async () => ({
            id: inserted.id,
            data: () => inserted,
            exists: true
          })
        };
      } catch (error) {
        console.error(`Collection add hatası (${this.collectionName}):`, error);
        throw error;
      }
    }

    // Real-time listener (Supabase'de subscription)
    onSnapshot(callback) {
      this.ensureInitialized().then(() => {
        const subscription = this.supabase
          .channel(`${this.collectionName}_changes`)
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: this.collectionName },
            (payload) => {
              // Firestore snapshot formatına dönüştür
              const snapshot = {
                docChanges: () => [{
                  type: payload.eventType === 'INSERT' ? 'added' : 
                        payload.eventType === 'UPDATE' ? 'modified' : 'removed',
                  doc: {
                    id: payload.new?.id || payload.old?.id,
                    data: () => payload.new || payload.old
                  }
                }],
                docs: payload.new ? [{
                  id: payload.new.id,
                  data: () => payload.new
                }] : []
              };
              callback(snapshot);
            }
          )
          .subscribe();

        // Unsubscribe fonksiyonu
        return () => {
          subscription.unsubscribe();
        };
      });

      // Geçici olarak boş snapshot döndür
      callback({
        docChanges: () => [],
        docs: [],
        empty: true
      });
    }

    async ensureInitialized() {
      if (!this.supabase) {
        this.supabase = await getSupabase();
        if (!this.supabase) {
          throw new Error('Supabase client yüklenemedi');
        }
      }
    }
  }

  // Document Reference (Firestore API uyumlu)
  class SupabaseDocumentReference {
    constructor(supabase, collectionName, docId) {
      this.supabase = supabase;
      this.collectionName = collectionName;
      this.docId = docId;
    }

    // Document get
    async get() {
      await this.ensureInitialized();
      
      // ensureInitialized sonrası this.supabase kontrolü
      if (!this.supabase || typeof this.supabase.from !== 'function') {
        throw new Error('Supabase client yüklenemedi');
      }
      
      try {
        const { data, error } = await this.supabase
          .from(this.collectionName)
          .select('*')
          .eq('id', this.docId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Doküman yok
            return {
              id: this.docId,
              exists: false,
              data: () => null
            };
          }
          throw error;
        }

        return {
          id: data.id,
          exists: true,
          data: () => data
        };
      } catch (error) {
        console.error(`Document get hatası (${this.collectionName}/${this.docId}):`, error);
        return {
          id: this.docId,
          exists: false,
          data: () => null
        };
      }
    }

    // Document set
    async set(data, options = {}) {
      await this.ensureInitialized();
      
      try {
        const docData = { ...data, id: this.docId };
        
        const { error } = await this.supabase
          .from(this.collectionName)
          .upsert(docData, { onConflict: 'id' });

        if (error) {
          throw error;
        }

        return { id: this.docId };
      } catch (error) {
        console.error(`Document set hatası (${this.collectionName}/${this.docId}):`, error);
        throw error;
      }
    }

    // Document update
    async update(data) {
      await this.ensureInitialized();
      
      try {
        const { error } = await this.supabase
          .from(this.collectionName)
          .update(data)
          .eq('id', this.docId);

        if (error) {
          throw error;
        }

        return { id: this.docId };
      } catch (error) {
        console.error(`Document update hatası (${this.collectionName}/${this.docId}):`, error);
        throw error;
      }
    }

    // Document delete
    async delete() {
      await this.ensureInitialized();
      
      try {
        const { error } = await this.supabase
          .from(this.collectionName)
          .delete()
          .eq('id', this.docId);

        if (error) {
          throw error;
        }

        return { id: this.docId };
      } catch (error) {
        console.error(`Document delete hatası (${this.collectionName}/${this.docId}):`, error);
        throw error;
      }
    }

    // Sub-collection (nested)
    collection(subCollectionName) {
      // Supabase'de nested collections yok, bu yüzden farklı bir yaklaşım gerekir
      // Örnek: talebeler/{devre}/öğrenciler/{uid} -> talebeler tablosu (devre kolonu ile)
      console.warn(`Nested collection "${subCollectionName}" Supabase'de desteklenmiyor. Düzleştirilmiş yapı kullanın.`);
      return new SupabaseCollectionReference(this.supabase, `${this.collectionName}_${subCollectionName}`);
    }

    async ensureInitialized() {
      if (!this.supabase) {
        this.supabase = await getSupabase();
        if (!this.supabase) {
          throw new Error('Supabase client yüklenemedi');
        }
      }
    }
  }

  // Query Builder (Firestore where/limit/orderBy uyumlu)
  class SupabaseQueryBuilder {
    constructor(supabase, collectionName) {
      this.supabase = supabase;
      this.collectionName = collectionName;
      this.queries = [];
      this.limitCount = null;
      this.orderByField = null;
      this.orderByDir = 'asc';
    }

    where(field, operator, value) {
      this.queries.push({ field, operator, value });
      return this;
    }

    limit(count) {
      this.limitCount = count;
      return this;
    }

    orderBy(field, direction = 'asc') {
      this.orderByField = field;
      this.orderByDir = direction;
      return this;
    }

    async get() {
      await this.ensureInitialized();
      
      try {
        let query = this.supabase
          .from(this.collectionName)
          .select('*');

        // Where clauses
        for (const q of this.queries) {
          const op = this.convertOperator(q.operator);
          if (op === 'eq') {
            query = query.eq(q.field, q.value);
          } else if (op === 'neq') {
            query = query.neq(q.field, q.value);
          } else if (op === 'gt') {
            query = query.gt(q.field, q.value);
          } else if (op === 'gte') {
            query = query.gte(q.field, q.value);
          } else if (op === 'lt') {
            query = query.lt(q.field, q.value);
          } else if (op === 'lte') {
            query = query.lte(q.field, q.value);
          } else if (op === 'like') {
            query = query.like(q.field, `%${q.value}%`);
          } else if (op === 'in') {
            query = query.in(q.field, q.value);
          }
        }

        // Order by
        if (this.orderByField) {
          query = query.order(this.orderByField, { ascending: this.orderByDir === 'asc' });
        }

        // Limit
        if (this.limitCount) {
          query = query.limit(this.limitCount);
        }

        const { data, error } = await query;

        if (error) {
          if (error.message && error.message.includes('does not exist')) {
            console.warn(`⚠️  Tablo "${this.collectionName}" Supabase'de yok`);
            return new SupabaseQuerySnapshot([]);
          }
          throw error;
        }

        const docs = (data || []).map(item => ({
          id: item.id,
          data: () => item,
          exists: true
        }));

        return new SupabaseQuerySnapshot(docs);
      } catch (error) {
        console.error(`Query get hatası (${this.collectionName}):`, error);
        return new SupabaseQuerySnapshot([]);
      }
    }

    convertOperator(op) {
      const opMap = {
        '==': 'eq',
        '!=': 'neq',
        '>': 'gt',
        '>=': 'gte',
        '<': 'lt',
        '<=': 'lte',
        'array-contains': 'contains',
        'in': 'in'
      };
      return opMap[op] || 'eq';
    }

    async ensureInitialized() {
      if (!this.supabase) {
        this.supabase = await getSupabase();
        if (!this.supabase) {
          throw new Error('Supabase client yüklenemedi');
        }
      }
    }
  }

  // Query Snapshot (Firestore API uyumlu)
  class SupabaseQuerySnapshot {
    constructor(docs) {
      this.docs = docs;
      this.empty = docs.length === 0;
      this.size = docs.length;
    }

    forEach(callback) {
      this.docs.forEach(callback);
    }

    docChanges() {
      // Real-time değişiklikler için (şimdilik boş)
      return [];
    }
  }

  // Batch (Supabase'de yok, manuel yapılmalı)
  class SupabaseBatch {
    constructor(supabase) {
      this.supabase = supabase;
      this.operations = [];
    }

    set(ref, data) {
      this.operations.push({ type: 'set', ref, data });
      return this;
    }

    update(ref, data) {
      this.operations.push({ type: 'update', ref, data });
      return this;
    }

    delete(ref) {
      this.operations.push({ type: 'delete', ref });
      return this;
    }

    async commit() {
      // Supabase'de batch yok, tek tek yapılmalı
      for (const op of this.operations) {
        try {
          if (op.type === 'set') {
            await op.ref.set(op.data);
          } else if (op.type === 'update') {
            await op.ref.update(op.data);
          } else if (op.type === 'delete') {
            await op.ref.delete();
          }
        } catch (error) {
          console.error('Batch operation hatası:', error);
          throw error;
        }
      }
    }
  }

  // Global instance
  let dbInstance = null;

  // Firebase Firestore benzeri global fonksiyon
  window.getSupabaseDB = function() {
    if (!dbInstance) {
      dbInstance = new SupabaseDBWrapper();
    }
    return dbInstance;
  };

  // Firebase uyumluluğu için
  if (typeof window.firebase === 'undefined') {
    window.firebase = {};
  }

  // Eğer Firestore yoksa, Supabase DB'yi kullan
  if (typeof window.firebase.firestore === 'undefined') {
    window.firebase.firestore = function() {
      return window.getSupabaseDB();
    };
  }

  console.log('✅ Supabase DB Wrapper yüklendi');
})();

