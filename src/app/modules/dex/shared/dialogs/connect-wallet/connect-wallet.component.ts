import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { generatePhrase, encryptToKeyStore } from '@xchainjs/xchain-crypto';
import { environment } from 'src/environments/environment';
import { KeystoreService } from '@dexShared/services/keystore.service';
import { Asset } from '@dexShared/classes/asset';

/* Master Wallet Manager */
import { MasterWalletManagerService } from '@app/services/master-wallet-manager.service';
import { WalletData } from '../../interfaces/marketcap';
import { UserService } from '../../services/user.service';
import { consoleLog } from '@app/utils/consoles';
import * as bchRegex from 'bitcoincash-regex';

import { TranslateService } from '@ngx-translate/core';

interface Chain {
  asset: Asset;
  enabled: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-connect-wallet',
  templateUrl: './connect-wallet.component.html',
  styleUrls: ['./connect-wallet.component.scss'],
})
export class ConnectWalletComponent implements OnInit {
  public showKeyStoreForm: boolean;
  public showXDEFIForm: boolean;
  public showWCForm: boolean;
  public file: any;
  public keystorePassword: string;
  public createkeystorePassword: string;
  public createkeystorePasswordConfirm: string;
  public secretPhrase: string;
  public phrasekeystorePassword: string;
  public phrasekeystorePasswordConfirm: string;
  public manualWallet: string;
  public keystoreFileSelected: boolean;
  public keystore: any;
  public keystoreConnecting: boolean;
  public keystoreError: boolean;
  public showKeystoreChainForm: boolean;
  public fileName: string;
  public keystoreFileExist: boolean;
  public keystoreErrorMsg: string;
  public showWalletConnect: boolean;
  public showManualInput: boolean;
  public showKeystore: boolean;
  public showKeystoreFilecreate: boolean;
  public showKeystorePhrasecreate: boolean;
  public showKeystoreFilecreateForm: boolean;
  public showKeystorePhrasecreateForm: boolean;
  public showManual: boolean;
  public showXDefi: boolean;
  public manualInputError: boolean;
  public manualInputErrorMsg: string;
  public rememberWallet = false;
  public bitcoinRegex =
    /^(?:[13]{1}[a-km-zA-HJ-NP-Z1-9]{26,33}|bc1[a-z0-9]{39,59}|tb1[a-z0-9]{39,59})$/;
  public litecoinRegex =
    /(?:^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}|tltc[a-z0-9]{39,59}|ltc[a-z0-9]{39,59}$)/;
  public ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  public binanceRegex = /^(?:tbnb[a-z0-9]{39,59}|bnb[a-z0-9]{39,59})$/;
  public thorchainRegex = /^(?:thor[a-z0-9]{39,59}|tthor[a-z0-9]{39,59})$/;
  public dogeRegex =
    /^(?:D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}|n{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32})$/;
  public xdefiChainNames: string[];
  public xdefiChains: Chain[] = [];
  public keystoreChainNames: string[];
  public keystoreChains: Chain[] = [];
  public allKeystoreSelected = false;
  public allXdefiSelected = false;
  public wcChainNames: string[];
  public wcChains: Chain[] = [];
  public allWCSelected = false;
  public XDEFIlabel: string;

  public xdefiAll = false;
  public wcAll = false;

  public keystorePasswordHide = true;
  public createPasswordHide = true;
  public createConfirmPasswordHide = true;
  public secretPhraseHide = true;
  public phrasePasswordHide = true;
  public phraseConfirmPasswordHide = true;

  public language: string;
  public translation: any;

  constructor(
    public dialogRef: MatDialogRef<ConnectWalletComponent>,
    @Inject(MAT_DIALOG_DATA) public selection: any,
    private keystoreService: KeystoreService,
    private marketcapService: MasterWalletManagerService,
    private userService: UserService,
    public translate: TranslateService
  ) {
    this.marketcapService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  ngOnInit() {
    this.showWalletConnect = this.selection.showWalletConnect;
    this.showKeystore = this.selection.showKeystore;
    this.showKeystoreFilecreate = this.selection.showKeystoreFilecreate;
    this.showKeystorePhrasecreate = this.selection.showKeystorePhrasecreate;
    this.showManual = this.selection.showManual;
    this.showXDefi = this.selection.showXDefi;

    this.marketcapService.getOriginalPools().subscribe((data) => {
      if (data == null) {
        //this.marketcapService.getPools('USD').subscribe();
      }
    });

    this.xdefiChainNames = [
      'BTC.BTC',
      'BCH.BCH',
      'BNB.BNB',
      'DOGE.DOGE',
      'ETH.ETH',
      'LTC.LTC',
      'THOR.RUNE',
    ];

    this.keystoreChainNames = [
      'BTC.BTC',
      //'BCH.BCH',
      'BNB.BNB',
      'DOGE.DOGE',
      'ETH.ETH',
      //'LTC.LTC',
      'THOR.RUNE',
    ];

    this.wcChainNames = ['BNB.BNB', 'ETH.ETH', 'THOR.RUNE'];

    this.marketcapService.walletData$.subscribe((walletData) => {
      //WalletConnect
      for (let i = 0; i < this.wcChainNames.length; i++) {
        let enabled = true;
        let selected = false;
        const asset = new Asset(this.wcChainNames[i]);
        if (walletData != null) {
          const isDuplicated = walletData.filter(
            (data) => data.chain == asset.chain && data.type == 'walletconnect'
          );
          if (isDuplicated.length != 0) {
            enabled = false;
            selected = true;
          } else {
            enabled = true;
            selected = false;
          }
        }

        this.wcChains.push({
          asset: asset,
          enabled: enabled,
          selected: selected,
        });
      }

      //Keystore
      for (let i = 0; i < this.keystoreChainNames.length; i++) {
        let enabled = true;
        let selected = false;
        const asset = new Asset(this.keystoreChainNames[i]);
        if (walletData != null) {
          const isDuplicated = walletData.filter(
            (data) => data.chain == asset.chain && data.type == 'keystore'
          );
          if (isDuplicated.length != 0) {
            enabled = false;
            selected = true;
          } else {
            enabled = true;
            selected = false;
          }
        }

        this.keystoreChains.push({
          asset: asset,
          enabled: enabled,
          selected: selected,
        });
      }

      //XDEFI
      for (let i = 0; i < this.xdefiChainNames.length; i++) {
        let enabled = true;
        let selected = false;
        const asset = new Asset(this.xdefiChainNames[i]);
        if (
          (window as any).xfi &&
          (window as any).xfi[asset.fullChainName] &&
          (window as any).xfi[asset.fullChainName] != undefined
        ) {
          if (walletData != null && walletData.length > 0) {
            const isDuplicated = walletData.filter(
              (data) => data.chain == asset.chain && data.type == 'xdefi'
            );
            if (isDuplicated.length != 0) {
              //is already imported
              enabled = false;
              selected = true;
            } else {
              //consoleLog(asset.fullChainName + ' successfully imported');
              enabled = true;
            }
          }
        } else {
          //provider is not enabled
          consoleLog(asset.fullChainName + ' provider not enabled');
          enabled = false;
        }

        this.xdefiChains.push({
          asset: asset,
          enabled: enabled,
          selected: selected,
        });
      }
    });

    this.marketcapService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
        if ((window as any).xfi) {
          this.XDEFIlabel =
            this.translation.wallet_connect.main_menu.xdefi.connect;
        } else {
          this.XDEFIlabel =
            this.translation.wallet_connect.main_menu.xdefi.install;
        }
      });
    });
  }

  async onKeystoreFileChange(event: Event) {
    this.keystoreFileSelected = true;

    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      const keystoreFile = files[0];
      this.fileName = keystoreFile.name;
      localStorage.setItem('keystore-file', this.fileName);

      const reader = new FileReader();

      const onLoadHandler = () => {
        try {
          const key = JSON.parse(reader.result as string);
          if (!('version' in key) || !('crypto' in key)) {
            this.keystoreError = true;
            this.keystoreErrorMsg =
              this.translation.wallet_connect.keystore.msgs.invalid_keystore;
            console.error('not a valid keystore file');
          } else {
            this.keystoreError = false;
            this.keystore = key;
          }
        } catch {
          this.keystoreError = true;
          this.keystoreErrorMsg =
            this.translation.wallet_connect.keystore.msgs.invalid_json;
          console.error('not a valid json file');
        }
      };
      reader.addEventListener('load', onLoadHandler);

      await reader.readAsText(keystoreFile);
    }
  }

  async createKeystore(phrase: string, password: string) {
    this.keystoreConnecting = true;

    try {
      const keystore = await encryptToKeyStore(phrase, password);
      const user = await this.keystoreService.unlockKeystore(
        keystore,
        password
      );

      const keystoreData = localStorage.getItem('keystore');
      if (!keystoreData) {
        localStorage.setItem('keystore', JSON.stringify(keystore));

        /* */
        const addresses: string[] = [];

        addresses.push(await user.clients.bitcoin.getAddress());
        addresses.push(await user.clients.binance.getAddress());
        addresses.push(await user.clients.bitcoinCash.getAddress());
        addresses.push(await user.clients.litecoin.getAddress());
        addresses.push(await user.clients.ethereum.getAddress());
        addresses.push(await user.clients.dogecoin.getAddress());
        addresses.push(await user.clients.thorchain.getAddress());

        for (let i = 0; i < addresses.length; i++) {
          const walletData = this.marketcapService.createWalletData(
            addresses[i],
            'keystore'
          );

          consoleLog('setKeystoreWalletData');
          this.marketcapService.findBalance(walletData, 'USD').then(
            (data) => {
              //remember wallet
              const walletDataFromStorage: WalletData[] = JSON.parse(
                localStorage.getItem('dcf-wallet-data')
              );
              if (walletDataFromStorage == null) {
                localStorage.setItem(
                  'dcf-wallet-data',
                  JSON.stringify([walletData])
                );
              } else {
                walletDataFromStorage.push(walletData);
                localStorage.setItem(
                  'dcf-wallet-data',
                  JSON.stringify(walletDataFromStorage)
                );
              }
            },
            (error) => {
              console.error(error);
            }
          );
        }
        /* */
      }

      const thorAddress = await user.clients.thorchain.getAddress();
      const addressLength = thorAddress.length;
      const minAddress = `${thorAddress.substring(
        0,
        environment.network === 'testnet' ? 7 : 6
      )}_${thorAddress.substring(addressLength - 3, addressLength)}`;
      const bl = new Blob([JSON.stringify(keystore)], {
        type: 'text/plain',
      });
      const fileName = `DCFkeystore-${minAddress}`;
      if (!keystoreData) {
        localStorage.setItem('keystore-file', fileName);
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(bl);
      a.download = fileName;
      a.hidden = true;
      document.body.appendChild(a);
      a.innerHTML = 'loading';
      a.click();
    } catch (error) {
      console.error(error);
    }

    this.closeDialog();
  }

  async keystoreUnlockClicked() {
    this.keystoreError = false;
    //for keystore validation
    if (this.showKeyStoreForm == true) {
      if (this.fileName && this.fileName.length > 0) {
        if (this.keystorePassword && this.keystorePassword.length > 0) {
          this.keystoreConnecting = true;
          this.keystoreError = false;

          setTimeout(() => {
            this.keystoreUnlock();
          }, 100);
        } else {
          this.keystoreError = true;
          this.keystoreErrorMsg =
            this.translation.wallet_connect.keystore.msgs.empty;
        }
      } else {
        this.keystoreError = true;
        this.keystoreErrorMsg =
          this.translation.wallet_connect.keystore_create.msgs.no_file;
      }
    }

    //Keystore creation with random generated phrase
    if (this.showKeystoreFilecreateForm == true) {
      if (!this.createkeystorePassword || !this.createkeystorePasswordConfirm) {
        this.keystoreError = true;
        this.keystoreErrorMsg =
          this.translation.wallet_connect.keystore_create.msgs.empty;
        return;
      }

      if (this.createkeystorePassword !== this.createkeystorePasswordConfirm) {
        this.keystoreError = true;
        this.keystoreErrorMsg =
          this.translation.wallet_connect.keystore_create.msgs.invalid;
        return;
      }
      const phrase = generatePhrase();

      this.createKeystore(phrase, this.createkeystorePassword);
    }

    //Keystore create by phrase
    if (this.showKeystorePhrasecreateForm == true) {
      if (
        !this.secretPhrase ||
        !this.phrasekeystorePassword ||
        !this.phrasekeystorePasswordConfirm
      ) {
        this.keystoreError = true;
        this.keystoreErrorMsg =
          this.translation.wallet_connect.phrase_import.msgs.empty;
        return;
      }

      if (this.secretPhrase.split(' ').length != 12) {
        this.keystoreError = true;
        this.keystoreErrorMsg =
          this.translation.wallet_connect.phrase_import.msgs.invalid_phrase;
        return;
      }

      if (this.phrasekeystorePassword !== this.phrasekeystorePasswordConfirm) {
        this.keystoreError = true;
        this.keystoreErrorMsg =
          this.translation.wallet_connect.phrase_import.msgs.not_match;
        return;
      }

      this.createKeystore(this.secretPhrase, this.phrasekeystorePassword);
    }

    //for xdefi validation
    if (this.showXDEFIForm == true) {
      if (
        this.xdefiChains.filter((chain) => chain.selected).length > 0 &&
        this.showXDEFIForm
      ) {
        const _filter = this.xdefiChains.filter((chain) => chain.selected);
        const selected = _filter.map(({ asset }) => asset.fullChainName);
        const wallet = { type: 'xdefi', chains: selected };
        this.dialogRef.close(wallet);
      }
    }

    // for wallet connect validation
    if (this.showWCForm == true) {
      if (
        this.wcChains.filter((chain) => chain.selected).length > 0 &&
        this.showWCForm
      ) {
        const _filter = this.wcChains.filter((chain) => chain.selected);
        const selected = _filter.map(({ asset }) => asset.fullChainName);
        const wallet = { type: 'walletconnect', chains: selected };
        this.dialogRef.close(wallet);
      }
    }

    //for manual input validation
    if (
      this.showManualInput &&
      this.manualWallet &&
      this.manualWallet.length > 0
    ) {
      const isBitcoin = this.bitcoinRegex.test(this.manualWallet);
      const isEthereum = this.ethereumRegex.test(this.manualWallet);
      const isBCH = bchRegex({ exact: true }).test(this.manualWallet);
      const isLitecoin = this.litecoinRegex.test(this.manualWallet);
      const isBinance = this.binanceRegex.test(this.manualWallet);
      const isThorchain = this.thorchainRegex.test(this.manualWallet);
      const isDogecoin = this.dogeRegex.test(this.manualWallet);
      let chain = '';
      const mask = this.getMask(this.manualWallet);
      let logo = '';
      this.manualInputError = false;

      this.marketcapService.walletData$.subscribe((walletData) => {
        if (isBitcoin == true) {
          chain = 'BTC';
          logo =
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png';
        } else if (isEthereum == true) {
          chain = 'ETH';
          logo =
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/ETH-1C9/logo.png';
        } else if (isBCH == true) {
          chain = 'BCH';
          logo =
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BCH-1FD/logo.png';
        } else if (isLitecoin == true) {
          chain = 'LTC';
          logo =
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/LTC-F07/logo.png';
        } else if (isBinance == true) {
          chain = 'BNB';
          logo =
            '/assets/icons/tokens/asset-bnb.30ddcde6eab16c1b101775001ca5cc45.svg';
        } else if (isThorchain == true) {
          chain = 'THOR';
          logo =
            '/assets/icons/tokens/asset-rune.84d6fe9e6b77ef92d048fe7a44c9370d.svg';
        } else if (isDogecoin == true) {
          chain = 'DOGE';
          logo = '/assets/icons/tokens/dogecoin.b8d7759b60f351e31caf.png';
        } else {
          this.manualInputError = true;
          this.manualInputErrorMsg =
            this.translation.wallet_connect.manual.invalid;
        }

        if (walletData != null) {
          const duplicate = walletData.filter(
            (data) => data.address == this.manualWallet
          );
          if (duplicate.length > 0) {
            this.manualInputError = true;
            this.manualInputErrorMsg =
              this.translation.wallet_connect.manual.already_imported;
          }
        }

        if (this.manualInputError == false) {
          const wallet = {
            type: 'manual',
            address: this.manualWallet,
            chain: chain,
            mask: mask,
            logo: logo,
            remember: this.rememberWallet,
          };
          this.dialogRef.close(wallet);
        }
      });
    }
  }

  async keystoreUnlock() {
    this.keystoreError = false;

    try {
      const keystoreData = localStorage.getItem('keystore');
      if (!keystoreData) {
        localStorage.setItem('keystore', JSON.stringify(this.keystore));
      }
      const user = await this.keystoreService.unlockKeystore(
        this.keystore,
        this.keystorePassword
      );

      this.userService.setUser(user);

      const addresses: string[] = [];
      for (let i = 0; i < this.keystoreChains.length; i++) {
        if (this.keystoreChains[i].selected == true) {
          if (this.keystoreChains[i].asset.chain == 'BTC') {
            addresses.push(user.clients.bitcoin.getAddress());
          } else if (this.keystoreChains[i].asset.chain == 'BNB') {
            addresses.push(user.clients.binance.getAddress());
          } else if (this.keystoreChains[i].asset.chain == 'BCH') {
            addresses.push(user.clients.bitcoinCash.getAddress());
          } else if (this.keystoreChains[i].asset.chain == 'LTC') {
            addresses.push(user.clients.litecoin.getAddress());
          } else if (this.keystoreChains[i].asset.chain == 'ETH') {
            addresses.push(user.clients.ethereum.getAddress());
          } else if (this.keystoreChains[i].asset.chain == 'DOGE') {
            addresses.push(user.clients.dogecoin.getAddress());
          } else if (this.keystoreChains[i].asset.chain == 'THOR') {
            addresses.push(user.clients.thorchain.getAddress());
          }
        }
      }

      for (let i = 0; i < addresses.length; i++) {
        const walletData = this.marketcapService.createWalletData(
          addresses[i],
          'keystore'
        );

        if (
          environment.network == 'testnet' &&
          (walletData.chain == 'BTC' ||
            walletData.chain == 'DOGE' ||
            walletData.chain == 'ETH' ||
            walletData.chain == 'LTC')
        ) {
          this.marketcapService
            .getBalanceFromXchain(walletData, 'USD')
            .then((data) => {
              //remember wallet
              const walletDataFromStorage: WalletData[] = JSON.parse(
                localStorage.getItem('dcf-wallet-data')
              );
              if (walletDataFromStorage == null) {
                localStorage.setItem(
                  'dcf-wallet-data',
                  JSON.stringify([walletData])
                );
              } else {
                walletDataFromStorage.push(walletData);
                localStorage.setItem(
                  'dcf-wallet-data',
                  JSON.stringify(walletDataFromStorage)
                );
              }
            });
        } else {
          this.marketcapService.findBalance(walletData, 'USD').then(
            (data) => {
              //remember wallet
              const walletDataFromStorage: WalletData[] = JSON.parse(
                localStorage.getItem('dcf-wallet-data')
              );
              if (walletDataFromStorage == null) {
                localStorage.setItem(
                  'dcf-wallet-data',
                  JSON.stringify([walletData])
                );
              } else {
                walletDataFromStorage.push(walletData);
                localStorage.setItem(
                  'dcf-wallet-data',
                  JSON.stringify(walletDataFromStorage)
                );
              }
            },
            (error) => {
              console.error(error);
              this.marketcapService.getBalanceFromXchain(walletData, 'USD');
            }
          );
        }
      }
      this.closeDialog();
    } catch (error: any) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      this.keystoreErrorMsg =
        this.translation.wallet_connect.keystore.msgs.invalid;
      console.error(error);
    }
  }

  walletConnect(selection: any) {
    this.selection = selection;
    if (this.selection == 'walletconnect') {
      /*const wallet = {type: 'walletconnect'};
      this.dialogRef.close(wallet);*/
      this.showWCForm = true;
    } else if (this.selection == 'xdefi') {
      if ((window as any).xfi) {
        this.showXDEFIForm = true;
      } else {
        window.open('https://www.xdefi.io/', '_blank');
      }
    } else if (this.selection == 'keystore') {
      this.showKeystoreChainForm = true;
    } else if (this.selection == 'keystorefilecreate') {
      this.showKeystoreFilecreateForm = true;
    } else if (this.selection == 'keystorephrasecreate') {
      this.showKeystorePhrasecreateForm = true;
    } else {
      this.showManualInput = true;
    }
  }

  viewKeystoreForm() {
    // for wallet connect validation
    const keystore = localStorage.getItem('keystore');
    const keystoreFile = localStorage.getItem('keystore-file');
    if (
      !this.keystoreChains.every((chain) => chain.enabled == false) &&
      this.keystoreChains.filter((chain) => chain.selected).length > 0 &&
      this.showKeystoreChainForm
    ) {
      if (keystore && keystoreFile) {
        this.keystore = JSON.parse(keystore);
        this.keystoreFileExist = true;
        this.fileName = keystoreFile;
        this.keystoreFileSelected = true;
      }
      this.showKeystoreChainForm = false;
      this.showKeyStoreForm = true;
    }
  }

  back() {
    if (this.showKeyStoreForm == true) {
      this.showKeystoreChainForm = true;
      this.showKeyStoreForm = false;
      this.showManualInput = false;
      this.showXDEFIForm = false;
      this.showWCForm = false;
      this.showKeystoreFilecreateForm = false;
      this.showKeystorePhrasecreateForm = false;
    } else {
      this.showKeyStoreForm = false;
      this.showKeystoreChainForm = false;
      this.showManualInput = false;
      this.showXDEFIForm = false;
      this.showWCForm = false;
      this.showKeystoreFilecreateForm = false;
      this.showKeystorePhrasecreateForm = false;
    }
    this.keystoreErrorMsg = '';
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getMask(address: string) {
    const addressLenght = address.length;
    const mask =
      address.slice(0, 4) +
      '....' +
      address.slice(addressLenght - 4, addressLenght);

    return mask;
  }

  rememberWalletFn() {
    if (this.rememberWallet == false) {
      this.rememberWallet = true;
    } else {
      this.rememberWallet = false;
    }
  }

  someSelected(chains: Chain[], type: string): boolean {
    let boo: boolean;
    if (type == 'xdefi') {
      boo = this.allXdefiSelected;
    } else if (type == 'keystore') {
      boo = this.allKeystoreSelected;
    } else if (type == 'walletconnect') {
      boo = this.allWCSelected;
    }
    return chains.filter((chain) => chain.selected).length > 0 && !boo;
  }

  selectAllChains(type: string, checked: boolean) {
    if (type == 'xdefi') {
      this.allXdefiSelected = checked;
      this.xdefiChains.forEach((t) => (t.selected = checked));
    } else if (type == 'keystore') {
      this.allKeystoreSelected = checked;
      this.keystoreChains.forEach((t) => (t.selected = checked));
    } else if (type == 'walletconnect') {
      this.allWCSelected = checked;
      this.wcChains.forEach((t) => (t.selected = checked));
    }
  }

  validateAll(chains: Chain[], type: string) {
    if (type == 'xdefi') {
      this.allXdefiSelected = chains.every((t) => t.selected);
    } else if (type == 'keystore') {
      this.allKeystoreSelected = chains.every((t) => t.selected);
    } else if (type == 'walletconnect') {
      this.allWCSelected = chains.every((t) => t.selected);
    }
  }

  getAsterisk(chain: Chain) {
    let asterisk = '';
    if (chain.enabled == false && chain.selected == false) {
      asterisk = '**';
    } else if (chain.enabled == false && chain.selected == true) {
      asterisk = '*';
    }

    return asterisk;
  }

  validateIsDisabled(chains: Chain[]) {
    return (
      chains.filter(
        (chain) => chain.enabled == false && chain.selected == false
      ).length > 0
    );
  }

  validateIsSelected(chains: Chain[]) {
    return (
      chains.filter((chain) => chain.enabled == false && chain.selected == true)
        .length > 0
    );
  }
}
