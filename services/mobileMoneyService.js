/**
 * Service Mobile Money - Integration with Vodacom, Airtel, Orange (DRC)
 * Handles payment initiation, confirmation, and callback processing
 */

const axios = require('axios');

class MobileMoneyService {
  constructor() {
    // Configuration pour chaque opérateur (À adapter avec vos vrais credentials)
    this.operators = {
      vodacom: {
        name: 'Vodacom',
        code: 'VC',
        apiUrl: process.env.VODACOM_API_URL || 'https://api.vodacom.cd/payment',
        apiKey: process.env.VODACOM_API_KEY || 'test_vodacom_key',
        shortCode: process.env.VODACOM_SHORT_CODE || '*171#',
        timeout: 30000
      },
      airtel: {
        name: 'Airtel',
        code: 'AT',
        apiUrl: process.env.AIRTEL_API_URL || 'https://api.airtel.cd/payment',
        apiKey: process.env.AIRTEL_API_KEY || 'test_airtel_key',
        shortCode: process.env.AIRTEL_SHORT_CODE || '*120#',
        timeout: 30000
      },
      orange: {
        name: 'Orange',
        code: 'OG',
        apiUrl: process.env.ORANGE_API_URL || 'https://api.orange.cd/payment',
        apiKey: process.env.ORANGE_API_KEY || 'test_orange_key',
        shortCode: process.env.ORANGE_SHORT_CODE || '*151#',
        timeout: 30000
      }
    };
  }

  /**
   * Valide et formate le numéro de téléphone DRC
   * Accepte: +243, 0, ou 243
   */
  validatePhoneNumber(phone, operator) {
    let normalized = phone.replace(/\s/g, '');

    // Convertir tous les formats en +243...
    if (normalized.startsWith('0')) {
      normalized = '+243' + normalized.slice(1);
    } else if (normalized.startsWith('243')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+243')) {
      throw new Error('Format de numéro invalide. Utilisez +243, 0, ou 243');
    }

    // Vérifier la longueur (should be +243 + 9 digits)
    if (normalized.replace(/\D/g, '').length !== 12) {
      throw new Error('Numéro de téléphone invalide (doit faire 9-10 chiffres)');
    }

    return normalized;
  }

  /**
   * Initiate payment with specified operator
   */
  async initiatePayment(paymentData) {
    const { operateur, numero_telephone, montant, reference_transaction, devise } = paymentData;

    const operator = this.operators[operateur.toLowerCase()];
    if (!operator) {
      throw new Error(`Opérateur non supporté: ${operateur}. Utilisez vodacom, airtel, ou orange`);
    }

    const phoneNumber = this.validatePhoneNumber(numero_telephone, operateur);

    try {
      // Simuler l'appel API (en production, utilisez les vrais APIs)
      const response = await this._callMobileMoneyAPI(operator, {
        action: 'initiate',
        phone: phoneNumber,
        amount: montant,
        currency: devise || 'CDF',
        reference: reference_transaction,
        description: `Paiement PayPro Market - Réf: ${reference_transaction}`
      });

      return {
        success: true,
        operator: operator.name,
        shortCode: operator.shortCode,
        phone: phoneNumber,
        amount: montant,
        reference: reference_transaction,
        message: `Demande de paiement envoyée à ${phone}. Confirmez sur votre téléphone avec le code USSD ${operator.shortCode}`,
        apiResponse: response
      };
    } catch (error) {
      throw new Error(`Erreur Mobile Money (${operator.name}): ${error.message}`);
    }
  }

  /**
   * Confirm payment (called via webhook or admin confirmation)
   */
  async confirmPayment(reference_transaction, operateur) {
    const operator = this.operators[operateur.toLowerCase()];
    if (!operator) {
      throw new Error(`Opérateur non supporté: ${operateur}`);
    }

    try {
      const response = await this._callMobileMoneyAPI(operator, {
        action: 'confirm',
        reference: reference_transaction
      });

      return {
        success: true,
        operator: operator.name,
        reference: reference_transaction,
        status: 'confirmed',
        confirmedAt: new Date(),
        apiResponse: response
      };
    } catch (error) {
      throw new Error(`Erreur confirmation Mobile Money: ${error.message}`);
    }
  }

  /**
   * Verify payment status
   */
  async verifyPaymentStatus(reference_transaction, operateur) {
    const operator = this.operators[operateur.toLowerCase()];
    if (!operator) {
      throw new Error(`Opérateur non supporté: ${operateur}`);
    }

    try {
      const response = await this._callMobileMoneyAPI(operator, {
        action: 'verify',
        reference: reference_transaction
      });

      return {
        reference: reference_transaction,
        operator: operator.name,
        status: response.status || 'unknown',
        apiResponse: response
      };
    } catch (error) {
      throw new Error(`Erreur vérification Mobile Money: ${error.message}`);
    }
  }

  /**
   * Internal method to call Mobile Money APIs
   * In production, replace with actual API calls
   */
  async _callMobileMoneyAPI(operator, params) {
    // SIMULATION MODE - En production, intégrez les vrais APIs
    console.log(`[${operator.name}] API Call:`, params);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate successful response
    return {
      status: 'success',
      operator: operator.name,
      transactionId: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      // In production, this would come from the real API
      // For now, it's hardcoded for testing
    };

    /* PRODUCTION: Décommenter et adapter pour les vraies APIs
    try {
      const response = await axios.post(
        `${operator.apiUrl}/${params.action}`,
        {
          ...params,
          apiKey: operator.apiKey,
          timestamp: new Date().toISOString()
        },
        { timeout: operator.timeout }
      );
      return response.data;
    } catch (error) {
      throw new Error(`${operator.name} API Error: ${error.message}`);
    }
    */
  }

  /**
   * Process webhook callback from Mobile Money operator
   */
  processWebhookCallback(webhookData, operateur) {
    const operator = this.operators[operateur.toLowerCase()];
    if (!operator) {
      throw new Error(`Opérateur non supporté: ${operateur}`);
    }

    // Parse and validate webhook based on operator format
    const {
      reference_transaction,
      phone,
      amount,
      status,
      timestamp
    } = webhookData;

    return {
      reference_transaction,
      phone: this.validatePhoneNumber(phone, operateur),
      amount,
      status: status.toLowerCase() === 'success' ? 'confirmé' : 'échoué',
      operator: operator.name,
      processedAt: new Date(),
      originalTimestamp: timestamp
    };
  }

  /**
   * Get operator information
   */
  getOperatorInfo(operateur) {
    const operator = this.operators[operateur.toLowerCase()];
    if (!operator) {
      throw new Error(`Opérateur non supporté: ${operateur}`);
    }
    return {
      name: operator.name,
      code: operator.code,
      shortCode: operator.shortCode,
      supportedCurrencies: ['CDF', 'USD'],
      minAmount: 100,
      maxAmount: 1000000
    };
  }

  /**
   * List all supported operators
   */
  listOperators() {
    return Object.entries(this.operators).map(([key, value]) => ({
      id: key,
      name: value.name,
      code: value.code,
      shortCode: value.shortCode
    }));
  }
}

// Export singleton
module.exports = new MobileMoneyService();
