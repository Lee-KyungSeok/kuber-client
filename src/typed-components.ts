import * as styledComponents from "styled-components";
import { ThemedStyledComponentsModule } from "styled-components";

interface IThemeInterface {
    blueColor: string;
    greyColor: string;
    yellowColor: string;
    greenColor: string;
}

// 참고로 styled components4 버전에서는 injectGlobal 대신에 createGlobalStyle 을 사용한다.(그런데 아직 문서가 정리 안된거 같음)
const {
    default: styled,
    css,
    injectGlobal,
    keyframes,
    ThemeProvider
} = styledComponents as ThemedStyledComponentsModule<IThemeInterface>;

export { css, injectGlobal, keyframes, ThemeProvider };
export default styled;