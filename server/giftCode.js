// server/giftCode.js
const { supabase } = require('./supabaseClient');

/**
 * ギフトコードを使用してチップを獲得
 * @param {string} userId - ユーザーID
 * @param {string} code - ギフトコード
 * @returns {Promise<{success: boolean, chipAmount?: number, error?: string}>}
 */
async function useGiftCode(userId, code) {
  try {
    // 1. ギフトコードを取得
    const { data: giftCode, error: fetchError } = await supabase
      .from('gift_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (fetchError || !giftCode) {
      return { success: false, error: 'ギフトコードが見つかりません' };
    }

    // 2. バリデーション
    // 2-1. 有効化フラグチェック
    if (!giftCode.is_active) {
      return { success: false, error: 'このギフトコードは無効化されています' };
    }

    // 2-2. 有効期限チェック
    if (giftCode.expires_at) {
      const now = new Date();
      const expiresAt = new Date(giftCode.expires_at);
      if (now > expiresAt) {
        return { success: false, error: 'このギフトコードは期限切れです' };
      }
    }

    // 2-3. 使用回数チェック
    if (giftCode.max_uses !== null && giftCode.current_uses >= giftCode.max_uses) {
      return { success: false, error: 'このギフトコードは使用上限に達しています' };
    }

    // 3. 使用履歴チェック（同じユーザーが既に使っていないか）
    const { data: existingUsage } = await supabase
      .from('gift_code_usage')
      .select('id')
      .eq('gift_code_id', giftCode.id)
      .eq('user_id', userId)
      .single();

    if (existingUsage) {
      return { success: false, error: 'このギフトコードは既に使用済みです' };
    }

    // 4. トランザクション的に処理
    // 4-1. 使用履歴を記録
    const { error: usageError } = await supabase
      .from('gift_code_usage')
      .insert({
        gift_code_id: giftCode.id,
        user_id: userId,
        chip_amount: giftCode.chip_amount
      });

    if (usageError) {
      console.error('[GiftCode] Usage insert error:', usageError);
      return { success: false, error: '使用履歴の記録に失敗しました' };
    }

    // 4-2. ギフトコードの使用回数を増やす
    const { error: updateError } = await supabase
      .from('gift_codes')
      .update({ current_uses: giftCode.current_uses + 1 })
      .eq('id', giftCode.id);

    if (updateError) {
      console.error('[GiftCode] Update error:', updateError);
      // 使用履歴は記録されているが、使用回数更新に失敗
      // 実際のプロダクションではロールバックが必要
    }

    // 4-3. ユーザーのチップを増やす
    const { error: userUpdateError } = await supabase.rpc('increment_currency', {
      user_id: userId,
      amount: giftCode.chip_amount
    });

    if (userUpdateError) {
      console.error('[GiftCode] User currency update error:', userUpdateError);
      return { success: false, error: 'チップの付与に失敗しました' };
    }

    console.log(`[GiftCode] User ${userId} used code "${code}" and got ${giftCode.chip_amount} chips`);

    return {
      success: true,
      chipAmount: giftCode.chip_amount
    };

  } catch (error) {
    console.error('[GiftCode] Unexpected error:', error);
    return { success: false, error: 'ギフトコードの使用中にエラーが発生しました' };
  }
}

/**
 * ユーザーのギフトコード使用履歴を取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<Array>}
 */
async function getUserGiftCodeHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('gift_code_usage')
      .select(`
        id,
        chip_amount,
        used_at,
        gift_codes (
          code,
          created_by
        )
      `)
      .eq('user_id', userId)
      .order('used_at', { ascending: false });

    if (error) {
      console.error('[GiftCode] History fetch error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[GiftCode] Unexpected error:', error);
    return [];
  }
}

module.exports = {
  useGiftCode,
  getUserGiftCodeHistory
};