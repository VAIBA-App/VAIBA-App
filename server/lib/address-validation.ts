import { CountryCode, postcodeValidator } from 'postcode-validator';

export interface AddressValidationResult {
  isValid: boolean;
  errors: {
    street?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
}

const SUPPORTED_COUNTRIES = {
  'Deutschland': 'DE',
  'Österreich': 'AT',
  'Schweiz': 'CH'
} as const;

export async function validateAddress(address: {
  street: string;
  zipCode: string;
  city: string;
  country: string;
}): Promise<AddressValidationResult> {
  const errors: AddressValidationResult['errors'] = {};
  
  // Basic validation
  if (!address.street?.trim()) {
    errors.street = 'Straße ist erforderlich';
  }
  
  if (!address.city?.trim()) {
    errors.city = 'Stadt ist erforderlich';
  }
  
  if (!address.country?.trim()) {
    errors.country = 'Land ist erforderlich';
  } else if (!Object.keys(SUPPORTED_COUNTRIES).includes(address.country)) {
    errors.country = 'Land wird nicht unterstützt';
  }

  // Validate postal code format
  if (!address.zipCode?.trim()) {
    errors.zipCode = 'PLZ ist erforderlich';
  } else {
    const countryCode = SUPPORTED_COUNTRIES[address.country as keyof typeof SUPPORTED_COUNTRIES];
    if (countryCode) {
      const isValidPostcode = postcodeValidator(address.zipCode, countryCode as CountryCode);
      if (!isValidPostcode) {
        errors.zipCode = 'Ungültiges PLZ-Format';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
