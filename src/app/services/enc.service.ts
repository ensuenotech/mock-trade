import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as CryptoJS  from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncService {
  private key: string;
  private enabled: boolean;

  constructor() { 
    this.key = environment.authentication.rsa.key;
    this.enabled = environment.authentication.rsa.enabled;
  }
  isEnabled(): boolean {
    return this.enabled;
  }

  encrypt(plaintext: string): string {
    if (!this.enabled)
      return plaintext;
      return CryptoJS.AES.encrypt(plaintext,this.key).toString()
  }

  decrypt(cypher: string): string {
    if (!this.enabled)
      return cypher;

      return CryptoJS.AES.decrypt(cypher,this.key).toString(CryptoJS.enc.Utf8)
  }
}
