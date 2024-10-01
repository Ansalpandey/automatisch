import { describe, it, expect, vi } from 'vitest';
import AES from 'crypto-js/aes.js';
import enc from 'crypto-js/enc-utf8.js';

import AppAuthClient from './app-auth-client.js';
import appConfig from '../config/app.js';
import { createAppAuthClient } from '../../test/factories/app-auth-client.js';

describe('AppAuthClient model', () => {
  it('tableName should return correct name', () => {
    expect(AppAuthClient.tableName).toBe('app_auth_clients');
  });

  it('jsonSchema should have correct validations', () => {
    expect(AppAuthClient.jsonSchema).toMatchSnapshot();
  });

  it('encryptData should encrypt formattedAuthDefaults and set it to authDefaults', async () => {
    const formattedAuthDefaults = {
      key: 'value',
    };

    const appAuthClient = await createAppAuthClient({
      formattedAuthDefaults,
    });

    expect(
      JSON.parse(
        AES.decrypt(
          appAuthClient.authDefaults,
          appConfig.encryptionKey
        ).toString(enc)
      )
    ).toStrictEqual(formattedAuthDefaults);
  });

  it('decryptData should decrypt authDefaults and set it to formattedAuthDefaults', async () => {
    const formattedAuthDefaults = {
      key: 'value',
    };

    const appAuthClient = await createAppAuthClient({
      formattedAuthDefaults,
    });

    const refetchedAppAuthClient = await appAuthClient.$query();

    expect(refetchedAppAuthClient.formattedAuthDefaults).toStrictEqual(
      formattedAuthDefaults
    );
  });

  describe('eligibleForEncryption', () => {
    it('should return true when formattedAuthDefaults property exists', async () => {
      const appAuthClient = await createAppAuthClient();

      expect(appAuthClient.eligibleForEncryption()).toBe(true);
    });

    it("should return false when formattedAuthDefaults property doesn't exist", async () => {
      const appAuthClient = await createAppAuthClient();

      delete appAuthClient.formattedAuthDefaults;

      expect(appAuthClient.eligibleForEncryption()).toBe(false);
    });
  });

  describe('eligibleForDecryption', () => {
    it('should return true when authDefaults property exists', async () => {
      const appAuthClient = await createAppAuthClient();

      expect(appAuthClient.eligibleForDecryption()).toBe(true);
    });

    it("should return false when authDefaults property doesn't exist", async () => {
      const appAuthClient = await createAppAuthClient();

      delete appAuthClient.authDefaults;

      expect(appAuthClient.eligibleForDecryption()).toBe(false);
    });
  });

  it('$beforeInsert should call AppAuthClient.encryptData', async () => {
    const appAuthClientBeforeInsertSpy = vi.spyOn(
      AppAuthClient.prototype,
      'encryptData'
    );

    await createAppAuthClient();

    expect(appAuthClientBeforeInsertSpy).toHaveBeenCalledOnce();
  });

  it('$beforeUpdate should call AppAuthClient.encryptData', async () => {
    const appAuthClient = await createAppAuthClient();

    const appAuthClientBeforeUpdateSpy = vi.spyOn(
      AppAuthClient.prototype,
      'encryptData'
    );

    await appAuthClient.$query().patchAndFetch({ name: 'sample' });

    expect(appAuthClientBeforeUpdateSpy).toHaveBeenCalledOnce();
  });

  it('$afterFind should call AppAuthClient.decryptData', async () => {
    const appAuthClient = await createAppAuthClient();

    const appAuthClientAfterFindSpy = vi.spyOn(
      AppAuthClient.prototype,
      'decryptData'
    );

    await appAuthClient.$query();

    expect(appAuthClientAfterFindSpy).toHaveBeenCalledOnce();
  });
});
