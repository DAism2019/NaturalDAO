import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect'
import { shortenAddress } from '../../utils'

const useStyles1 = makeStyles(theme => ({
  root: {
    flexShrink: 0,
    // itemAlign:"left",
    color: theme.palette.text.secondary,
    // marginLeft: theme.spacing(2.5),
  },
  rootMobile:{
      flexShrink: 0,
      // marginLeft: theme.spacing(0),
      color: theme.palette.text.secondary,
      // marginBottom:theme.spacing(3)
  },
  button:{
      marginTop:theme.spacing(0),
       // marginLeft: theme.spacing(-40)
  },
  buttonLeft:{
      marginTop:theme.spacing(0),
       marginLeft: theme.spacing(-32)
  }
}));

function TablePaginationActions(props) {
  const classes = useStyles1();
  const theme = useTheme();
  const { count, page, rowsPerPage, onChangePage } = props;

  function handleFirstPageButtonClick(event) {
    onChangePage(event, 0);
  }

  function handleBackButtonClick(event) {
    onChangePage(event, page - 1);
  }

  function handleNextButtonClick(event) {
    onChangePage(event, page + 1);
  }

  function handleLastPageButtonClick(event) {
    onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  }
  if(isMobile){
      console.log("mobile")
      return (

              <div className={classes.rootMobile}>
                  <p>
                      &nbsp;
                  </p>
                  <div style={{marginLeft:100}}>
                      <IconButton
                          className = {classes.buttonLeft}
                        onClick={handleFirstPageButtonClick}
                        disabled={page === 0}
                        aria-label="First Page"

                      >
                        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
                      </IconButton>
                      <IconButton
                          className = {classes.button}
                          onClick={handleBackButtonClick}
                          disabled={page === 0}
                          aria-label="Previous Page" >
                        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
                      </IconButton>
                      <IconButton
                          className = {classes.button}
                        onClick={handleNextButtonClick}
                        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                        aria-label="Next Page"
                      >
                        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
                      </IconButton>
                      <IconButton
                          className = {classes.button}
                        onClick={handleLastPageButtonClick}
                        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                        aria-label="Last Page"
                      >
                        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
                      </IconButton>
                  </div>

              </div>


      )
  }else return (
      <div className={classes.root}>
          <IconButton
            onClick={handleFirstPageButtonClick}
            disabled={page === 0}
            aria-label="First Page"
          >
            {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
          </IconButton>
          <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="Previous Page">
            {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
          </IconButton>
          <IconButton
            onClick={handleNextButtonClick}
            disabled={page >= Math.ceil(count / rowsPerPage) - 1}
            aria-label="Next Page"
          >
            {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
          </IconButton>
          <IconButton
            onClick={handleLastPageButtonClick}
            disabled={page >= Math.ceil(count / rowsPerPage) - 1}
            aria-label="Last Page"
          >
            {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
          </IconButton>
      </div>

  );
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};



const useStyles2 = makeStyles(theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing(3),
  },
  table: {
    width:"100%"
  },
  tableWrapper: {
    overflowX: 'auto',
  }
}));

function getRow(row){
    return row.map((_data,_index) =>(
              getRowDetail(_data,_index)
         ))
}

function getRowDetail( _data,_index){
    let flag = _index === 0;
    if(flag){
        return (
            <TableCell key={_index} >
                <Link  to={"/ico-detail#" + _data} >
                    {isMobile ? shortenAddress(_data):_data}
                </Link>
         </TableCell>

        )
    }else{
        return (
            <TableCell  key={_index} padding='none'  >{_data}</TableCell>
        )
    }
}


export default function CustomPaginationActionsTable({headData,bodyData}) {
    // style={{width:"30%"}}
  const classes = useStyles2();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  // eslint-disable-next-line
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, bodyData.length - page * rowsPerPage);

  function handleChangePage(event, newPage) {
    setPage(newPage);
  }

  function handleChangeRowsPerPage(event) {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  return (
    <Paper className={classes.root}>
      <div className={classes.tableWrapper}>
        <Table className={classes.table}>
         <TableHead>
          <TableRow>
              {headData.map((_data,key) =>(
                       <TableCell  key={key} padding={key===0 ? "default":"none"}>{_data}</TableCell>
              ))}
          </TableRow>
        </TableHead>
          <TableBody>
            {bodyData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row,index) => (
              <TableRow key={row[0]}>
              { getRow(row) }
              </TableRow>
            ))}
            {/* {emptyRows > 0 && (
              <TableRow style={{ height: 48 * emptyRows }}>
                <TableCell colSpan={3} />
              </TableRow>
            )} */}
          </TableBody>
          <TableFooter>
            <TableRow style={{height:80,marginBottom:-30}} >

                    <TablePagination

                      rowsPerPageOptions={[5, 10, 25]}
                      colSpan={3}
                      count={bodyData.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      SelectProps={{
                        inputProps: { 'aria-label': 'Rows per page' },
                        native: true,
                      }}
                      onChangePage={handleChangePage}
                      onChangeRowsPerPage={handleChangeRowsPerPage}
                      ActionsComponent={TablePaginationActions}
                      style={{marginTop:-30}}
                    />


            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Paper>
  );
}
