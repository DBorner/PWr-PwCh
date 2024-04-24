import { Injectable } from '@nestjs/common';
import {
  AuthenticationDetails,
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';
import { ConfigService } from '@nestjs/config';
import { RegisterRequestDto } from './dto/register.request.dto';
import { AuthenticateRequestDto } from './dto/authenticate.request.dto';
import { ConfirmRequestDto } from './dto/confirm.request.dto';
import { RefreshRequestDto } from './dto/refresh.request.dto';

@Injectable()
export class AuthService {
  private userPool: CognitoUserPool;
  private userSessions: any = {};

  constructor(private configService: ConfigService) {
    this.userPool = new CognitoUserPool({
      UserPoolId: this.configService.get<string>('COGNITO_USER_POOL_ID'),
      ClientId: this.configService.get<string>('COGNITO_CLIENT_ID'),
    });
  }

  async register(authRegisterRequest: RegisterRequestDto) {
    const { name, nickName, email, password } = authRegisterRequest;
    return new Promise((resolve, reject) => {
      return this.userPool.signUp(
        name,
        password,
        [
          new CognitoUserAttribute({ Name: 'email', Value: email }),
          new CognitoUserAttribute({ Name: 'nickname', Value: nickName }),
        ],
        null,
        (err, result) => {
          if (!result) {
            reject(err);
          } else {
            resolve(result.user);
          }
        },
      );
    });
  }

  async authenticate(user: AuthenticateRequestDto) {
    const { name, password } = user;
    const authenticationDetails = new AuthenticationDetails({
      Username: name,
      Password: password,
    });
    const userData = {
      Username: name,
      Pool: this.userPool,
    };
    const newUser = new CognitoUser(userData);
    return new Promise((resolve, reject) => {
      return newUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          this.userSessions[name] = newUser;
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async confirmRegistration(confirm: ConfirmRequestDto) {
    const { name, code } = confirm;
    const userData = {
      Username: name,
      Pool: this.userPool,
    };
    const newUser = new CognitoUser(userData);
    return new Promise((resolve, reject) => {
      return newUser.confirmRegistration(code, true, (err, result) => {
        if (!result) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  async resendConfirmationCode(name: string) {
    const userData = {
      Username: name,
      Pool: this.userPool,
    };
    const newUser = new CognitoUser(userData);
    return new Promise((resolve, reject) => {
      return newUser.resendConfirmationCode((err, result) => {
        if (!result) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  async forgotPassword(name: string) {
    const userData = {
      Username: name,
      Pool: this.userPool,
    };
    const newUser = new CognitoUser(userData);
    return new Promise((resolve, reject) => {
      return newUser.forgotPassword({
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async confirmNewPassword(name: string, code: string, password: string) {
    const userData = {
      Username: name,
      Pool: this.userPool,
    };
    const newUser = new CognitoUser(userData);
    return new Promise<void>((resolve, reject) => {
      return newUser.confirmPassword(code, password, {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async changePassword(name: string, oldPassword: string, newPassword: string) {
    const userData = {
      Username: name,
      Pool: this.userPool,
    };
    const newUser = new CognitoUser(userData);
    return new Promise<void>((resolve, reject) => {
      return newUser.changePassword(oldPassword, newPassword, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async refreshTokens(refreshToken: RefreshRequestDto) {
    const refreshTokenObj = new CognitoUser({
      Username: refreshToken.name,
      Pool: this.userPool,
    });
    return new Promise((resolve, reject) => {
      return refreshTokenObj.refreshSession(
        new CognitoRefreshToken({ RefreshToken: refreshToken.refreshToken }),
        (err, session) => {
          if (err) {
            reject(err);
          } else {
            resolve(session);
          }
        },
      );
    });
  }

  async singOut(name: string) {
    const user = this.userSessions[name];
    if (!user) {
      throw new Error('User not found');
    }
    user.getSession((err: any, result: any) => {
      if (result) {
        user.globalSignOut({
          onSuccess: (result) => {
            this.userSessions[name] = null;
            return result;
          },
          onFailure: (err) => {
            return err;
          },
        });
      } else {
        return err;
      }
    });
  }
}
